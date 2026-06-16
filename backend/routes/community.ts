import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getIo } from "../socket/emitter.js";

const router = Router();

const CATEGORIES = [
  "general",
  "help",
  "lost_found",
  "event",
  "study",
  "housing",
] as const;

const CreatePostSchema = z
  .object({
    content: z.string().trim().max(5000).optional(),
    category: z.enum(CATEGORIES).default("general"),
    isUrgent: z.boolean().optional(),
    location: z.string().trim().max(200).optional(),
    mediaUrl: z.string().max(20_000_000).optional(),
    mediaType: z.enum(["image", "video"]).optional(),
  })
  .refine((d) => Boolean(d.content?.trim()) || Boolean(d.mediaUrl), {
    message: "Add some text or attach a photo/video.",
  });

const CommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

const ResolveSchema = z.object({
  resolved: z.boolean(),
});

const ReportSchema = z.object({
  reason: z.enum(["spam", "harassment", "misinformation", "inappropriate_content", "other"]),
  description: z.string().trim().max(1000).optional(),
});

const POST_FIELDS = `
  p.id, p.author_id AS authorId, p.content, p.category,
  p.is_urgent AS isUrgent, p.is_resolved AS isResolved, p.location,
  p.media_url AS mediaUrl, p.media_type AS mediaType,
  p.created_at AS createdAt, p.updated_at AS updatedAt,
  u.name AS authorName, u.avatar AS authorAvatar,
  u.verification_status AS authorVerification,
  (SELECT COUNT(*) FROM community_likes l WHERE l.post_id = p.id) AS likeCount,
  (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS commentCount,
  EXISTS(SELECT 1 FROM community_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS likedByMe
`;

function shapePost(row: any) {
  if (!row) return row;
  return {
    ...row,
    isUrgent: Boolean(row.isUrgent),
    isResolved: Boolean(row.isResolved),
    likedByMe: Boolean(row.likedByMe),
    likeCount: Number(row.likeCount ?? 0),
    commentCount: Number(row.commentCount ?? 0),
  };
}

function shapeComment(row: any) {
  return row;
}

function requireVerified(req: Request, res: Response): boolean {
  if (req.user?.verificationStatus !== "verified") {
    res
      .status(403)
      .json({ detail: "Only verified students can post in the community." });
    return false;
  }
  return true;
}

// Persist + push a live notification to a recipient (skips self-notifications).
function notify(
  recipientId: string,
  actorId: string,
  type: string,
  title: string,
  message: string,
  linkUrl: string,
) {
  if (recipientId === actorId) return;
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const timestamp = new Date().toISOString();
  db.prepare(
    `INSERT INTO notifications (id, recipient_id, type, title, message, link_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, recipientId, type, title, message, linkUrl, timestamp);
  const io = getIo();
  if (io) {
    io.to(recipientId).emit("receive_notification", {
      id,
      type,
      title,
      message,
      read: false,
      timestamp,
      recipientId,
      linkUrl,
    });
  }
}

const broadcast = (event: string, payload: any) => {
  const io = getIo();
  if (io) io.emit(event, payload);
};

// Fan out an urgent "need help now" post to every other student — persisted in
// their notification bell AND pushed live to anyone currently connected.
function broadcastUrgent(post: {
  id: string;
  authorId: string;
  authorName: string;
  content?: string | null;
}) {
  const recipients = db
    .prepare("SELECT id FROM users WHERE id != ?")
    .all(post.authorId) as { id: string }[];
  if (recipients.length === 0) return;

  const title = "🚨 Urgent help needed";
  const snippet = (post.content || "").trim().slice(0, 90);
  const message = `${post.authorName || "A student"} needs help${snippet ? `: ${snippet}` : ""}`;
  const linkUrl = `/community/${post.id}`;
  const ts = new Date().toISOString();
  const io = getIo();

  const insert = db.prepare(
    `INSERT INTO notifications (id, recipient_id, type, title, message, link_url, created_at)
     VALUES (?, ?, 'community', ?, ?, ?, ?)`,
  );
  const payloads: { recipientId: string; id: string }[] = [];
  const tx = db.transaction((rows: { id: string }[]) => {
    for (const r of rows) {
      const nid = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      insert.run(nid, r.id, title, message, linkUrl, ts);
      payloads.push({ recipientId: r.id, id: nid });
    }
  });
  tx(recipients);

  if (io) {
    for (const p of payloads) {
      io.to(p.recipientId).emit("receive_notification", {
        id: p.id,
        type: "community",
        title,
        message,
        read: false,
        timestamp: ts,
        recipientId: p.recipientId,
        linkUrl,
      });
    }
  }
}

// ── GET /api/community/ — the feed ─────────────────────────────────────────
router.get("/", requireAuth, (req: Request, res: Response) => {
  try {
    const me = req.user!.id;
    const { category, urgent, mine, q } = req.query as Record<string, string>;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;

    const where: string[] = [];
    const params: any[] = [me];

    if (category && CATEGORIES.includes(category as any)) {
      where.push("p.category = ?");
      params.push(category);
    }
    if (urgent === "1" || urgent === "true") {
      where.push("p.is_urgent = 1 AND p.is_resolved = 0");
    }
    if (mine === "1" || mine === "true") {
      where.push("p.author_id = ?");
      params.push(me);
    }
    if (q && q.trim()) {
      where.push("(p.content LIKE ? OR p.location LIKE ?)");
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = db
      .prepare(
        `SELECT ${POST_FIELDS}
         FROM community_posts p
         JOIN users u ON p.author_id = u.id
         ${whereSql}
         ORDER BY (p.is_urgent = 1 AND p.is_resolved = 0) DESC, p.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as any[];

    res.json(rows.map(shapePost));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ── POST /api/community/ — create a post ───────────────────────────────────
router.post(
  "/",
  requireAuth,
  validate(CreatePostSchema),
  (req: Request, res: Response) => {
    try {
      if (!requireVerified(req, res)) return;
      const me = req.user!.id;
      const { content, category, isUrgent, location, mediaUrl, mediaType } =
        req.body;

      const id = `cp-${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
      db.prepare(
        `INSERT INTO community_posts
           (id, author_id, content, category, is_urgent, location, media_url, media_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        me,
        content?.trim() || null,
        category,
        isUrgent ? 1 : 0,
        location?.trim() || null,
        mediaUrl || null,
        mediaUrl ? mediaType || "image" : null,
      );

      const post = shapePost(
        db
          .prepare(
            `SELECT ${POST_FIELDS}
             FROM community_posts p JOIN users u ON p.author_id = u.id
             WHERE p.id = ?`,
          )
          .get(me, id),
      );

      broadcast("community:post_created", post);
      if (post.isUrgent) {
        broadcastUrgent({
          id: post.id,
          authorId: me,
          authorName: req.user!.name,
          content: post.content,
        });
      }
      res.status(201).json(post);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── GET /api/community/:id — a single post ─────────────────────────────────
router.get("/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const me = req.user!.id;
    const post = shapePost(
      db
        .prepare(
          `SELECT ${POST_FIELDS}
           FROM community_posts p JOIN users u ON p.author_id = u.id
           WHERE p.id = ?`,
        )
        .get(me, req.params.id),
    );
    if (!post) {
      res.status(404).json({ detail: "Post not found" });
      return;
    }
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ── DELETE /api/community/:id — author or admin ────────────────────────────
router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const post = db
      .prepare("SELECT author_id FROM community_posts WHERE id = ?")
      .get(req.params.id) as any;
    if (!post) {
      res.status(404).json({ detail: "Post not found" });
      return;
    }
    if (post.author_id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ detail: "You can only delete your own posts" });
      return;
    }
    db.prepare("DELETE FROM community_posts WHERE id = ?").run(req.params.id);
    broadcast("community:post_deleted", { id: req.params.id });
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ── PATCH /api/community/:id/resolve — author marks need resolved ──────────
router.patch(
  "/:id/resolve",
  requireAuth,
  validate(ResolveSchema),
  (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const post = db
        .prepare("SELECT author_id FROM community_posts WHERE id = ?")
        .get(req.params.id) as any;
      if (!post) {
        res.status(404).json({ detail: "Post not found" });
        return;
      }
      if (post.author_id !== me) {
        res.status(403).json({ detail: "Only the author can update this" });
        return;
      }
      db.prepare(
        "UPDATE community_posts SET is_resolved = ?, updated_at = ? WHERE id = ?",
      ).run(req.body.resolved ? 1 : 0, new Date().toISOString(), req.params.id);

      const updated = shapePost(
        db
          .prepare(
            `SELECT ${POST_FIELDS}
             FROM community_posts p JOIN users u ON p.author_id = u.id
             WHERE p.id = ?`,
          )
          .get(me, req.params.id),
      );
      broadcast("community:post_updated", updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── POST /api/community/:id/like — toggle like ─────────────────────────────
router.post("/:id/like", requireAuth, (req: Request, res: Response) => {
  try {
    const me = req.user!.id;
    const post = db
      .prepare("SELECT id, author_id FROM community_posts WHERE id = ?")
      .get(req.params.id) as any;
    if (!post) {
      res.status(404).json({ detail: "Post not found" });
      return;
    }

    const existing = db
      .prepare(
        "SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?",
      )
      .get(req.params.id, me) as any;

    let liked: boolean;
    if (existing) {
      db.prepare("DELETE FROM community_likes WHERE id = ?").run(existing.id);
      liked = false;
    } else {
      db.prepare(
        "INSERT INTO community_likes (id, post_id, user_id) VALUES (?, ?, ?)",
      ).run(crypto.randomUUID().replace(/-/g, "").slice(0, 12), req.params.id, me);
      liked = true;
      notify(
        post.author_id,
        me,
        "community",
        "New like",
        `${req.user!.name || "Someone"} liked your community post.`,
        `/community/${post.id}`,
      );
    }

    const likeCount = (
      db
        .prepare(
          "SELECT COUNT(*) AS c FROM community_likes WHERE post_id = ?",
        )
        .get(req.params.id) as any
    ).c as number;

    broadcast("community:post_updated", { id: post.id, likeCount });
    res.json({ liked, likeCount });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ── GET /api/community/:id/comments — list comments ────────────────────────
router.get("/:id/comments", requireAuth, (req: Request, res: Response) => {
  try {
    const comments = db
      .prepare(
        `SELECT c.id, c.post_id AS postId, c.author_id AS authorId,
                c.content, c.created_at AS createdAt,
                u.name AS authorName, u.avatar AS authorAvatar
         FROM community_comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`,
      )
      .all(req.params.id) as any[];
    res.json(comments.map(shapeComment));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ── POST /api/community/:id/comments — add a comment ───────────────────────
router.post(
  "/:id/comments",
  requireAuth,
  validate(CommentSchema),
  (req: Request, res: Response) => {
    try {
      if (!requireVerified(req, res)) return;
      const me = req.user!.id;
      const post = db
        .prepare("SELECT id, author_id FROM community_posts WHERE id = ?")
        .get(req.params.id) as any;
      if (!post) {
        res.status(404).json({ detail: "Post not found" });
        return;
      }

      const id = `cc-${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
      db.prepare(
        "INSERT INTO community_comments (id, post_id, author_id, content) VALUES (?, ?, ?, ?)",
      ).run(id, req.params.id, me, req.body.content.trim());

      const comment = db
        .prepare(
          `SELECT c.id, c.post_id AS postId, c.author_id AS authorId,
                  c.content, c.created_at AS createdAt,
                  u.name AS authorName, u.avatar AS authorAvatar
           FROM community_comments c JOIN users u ON c.author_id = u.id
           WHERE c.id = ?`,
        )
        .get(id) as any;

      const commentCount = (
        db
          .prepare(
            "SELECT COUNT(*) AS c FROM community_comments WHERE post_id = ?",
          )
          .get(req.params.id) as any
      ).c as number;

      broadcast("community:comment_created", { postId: req.params.id, comment });
      broadcast("community:post_updated", { id: req.params.id, commentCount });

      notify(
        post.author_id,
        me,
        "community",
        "New comment",
        `${req.user!.name || "Someone"} commented on your community post.`,
        `/community/${post.id}`,
      );

      res.status(201).json(comment);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── POST /api/community/:id/report — report a post ────────────────────────
router.post(
  "/:id/report",
  requireAuth,
  validate(ReportSchema),
  (req: Request, res: Response) => {
    try {
      const me = req.user!.id;

      if (req.user?.role === "admin") {
        res.status(403).json({ detail: "Administrators do not report posts — use the Admin Panel to take action directly." });
        return;
      }

      const post = db
        .prepare("SELECT id, author_id FROM community_posts WHERE id = ?")
        .get(req.params.id) as any;
      if (!post) {
        res.status(404).json({ detail: "Post not found" });
        return;
      }

      if (post.author_id === me) {
        res.status(400).json({ detail: "You cannot report your own post." });
        return;
      }

      const { reason, description } = req.body;
      const id = `rpt-${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;

      try {
        db.prepare(
          `INSERT INTO community_reports (id, post_id, reporter_id, reason, description)
           VALUES (?, ?, ?, ?, ?)`,
        ).run(id, req.params.id, me, reason, description?.trim() || null);
      } catch (e: any) {
        if (e.message?.includes("UNIQUE")) {
          res.status(409).json({ detail: "You have already reported this post." });
          return;
        }
        throw e;
      }

      res.status(201).json({ message: "Report submitted. Our team will review it shortly." });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── DELETE /api/community/comments/:commentId — author or admin ────────────
router.delete(
  "/comments/:commentId",
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const comment = db
        .prepare(
          "SELECT author_id, post_id FROM community_comments WHERE id = ?",
        )
        .get(req.params.commentId) as any;
      if (!comment) {
        res.status(404).json({ detail: "Comment not found" });
        return;
      }
      if (comment.author_id !== req.user!.id && req.user!.role !== "admin") {
        res
          .status(403)
          .json({ detail: "You can only delete your own comments" });
        return;
      }
      db.prepare("DELETE FROM community_comments WHERE id = ?").run(
        req.params.commentId,
      );

      const commentCount = (
        db
          .prepare(
            "SELECT COUNT(*) AS c FROM community_comments WHERE post_id = ?",
          )
          .get(comment.post_id) as any
      ).c as number;

      broadcast("community:comment_deleted", {
        postId: comment.post_id,
        commentId: req.params.commentId,
        commentCount,
      });
      res.status(204).end();
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

export default router;
