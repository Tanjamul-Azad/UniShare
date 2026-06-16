import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import db from "../db/index.js";

const router = Router();

const ResolveReportSchema = z.object({
  action: z.enum(["dismissed", "banned", "restricted"]),
});

const UpdateUserStatusSchema = z.object({
  status: z.enum(["active", "banned", "restricted"]),
});

router.get("/stats", requireAdmin, (req, res) => {
  console.log(`[admin] Stats requested by ${req.user?.email}`);
  try {
    const totalUsers = (
      db.prepare("SELECT COUNT(*) as count FROM users").get() as any
    ).count;

    const verifiedUsers = (
      db.prepare("SELECT COUNT(*) as count FROM users WHERE verification_status = 'verified'").get() as any
    ).count;

    const pendingVerifications = (
      db.prepare("SELECT COUNT(*) as count FROM verification_requests WHERE status = 'pending'").get() as any
    ).count;

    const rejectedVerifications = (
      db.prepare("SELECT COUNT(*) as count FROM verification_requests WHERE status = 'rejected'").get() as any
    ).count;

    const totalListings = (
      db.prepare("SELECT COUNT(*) as count FROM marketplace_items WHERE is_active = 1").get() as any
    ).count;

    const pendingReports = (
      db.prepare("SELECT COUNT(*) as count FROM community_reports WHERE status = 'pending'").get() as any
    ).count;

    const recentVerifications = db
      .prepare(
        `SELECT vr.*, u.name AS user_name, u.email AS user_email
         FROM verification_requests vr
         LEFT JOIN users u ON vr.user_id = u.id
         ORDER BY vr.submitted_at DESC
         LIMIT 5`
      )
      .all() as any[];

    const recentListings = db
      .prepare(
        `SELECT m.id, m.title, m.type, m.price, u.name AS seller, m.created_at AS createdAt, m.image_url AS image
         FROM marketplace_items m
         LEFT JOIN users u ON m.seller_id = u.id
         WHERE m.is_active = 1
         ORDER BY m.created_at DESC
         LIMIT 5`
      )
      .all() as any[];

    const recentUsers = db
      .prepare(
        `SELECT id, name, email, verification_status AS verificationStatus, joined_date AS joinedDate, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT 5`
      )
      .all() as any[];

    res.json({
      totalUsers,
      verifiedUsers,
      pendingVerifications,
      rejectedVerifications,
      totalListings,
      pendingReports,
      recentVerifications,
      recentListings,
      recentUsers,
    });
  } catch (err: any) {
    console.error(`[admin] Error fetching stats: ${err.message}`);
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/admin/reports — all community reports
router.get("/reports", requireAdmin, (_req: Request, res: Response) => {
  try {
    const reports = db.prepare(
      `SELECT
        r.id, r.reason, r.description, r.status,
        r.created_at AS createdAt, r.reviewed_at AS reviewedAt,
        p.id AS postId, p.content AS postContent, p.category AS postCategory,
        p.created_at AS postCreatedAt,
        author.id AS reportedUserId, author.name AS reportedUserName, author.email AS reportedUserEmail,
        author.account_status AS reportedUserStatus,
        reporter.id AS reporterId, reporter.name AS reporterName, reporter.email AS reporterEmail,
        reviewer.name AS reviewerName
       FROM community_reports r
       JOIN community_posts p ON r.post_id = p.id
       JOIN users author ON p.author_id = author.id
       JOIN users reporter ON r.reporter_id = reporter.id
       LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
       ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC`
    ).all() as any[];
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// PATCH /api/admin/reports/:id — resolve a report (dismiss / ban / restrict)
router.patch(
  "/reports/:id",
  requireAdmin,
  validate(ResolveReportSchema),
  (req: Request, res: Response) => {
    try {
      const report = db
        .prepare("SELECT r.*, p.author_id FROM community_reports r JOIN community_posts p ON r.post_id = p.id WHERE r.id = ?")
        .get(req.params.id) as any;

      if (!report) {
        res.status(404).json({ detail: "Report not found" });
        return;
      }

      const { action } = req.body;
      const now = new Date().toISOString();

      db.prepare(
        "UPDATE community_reports SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?"
      ).run(action, req.user!.id, now, req.params.id);

      if (action === "banned" || action === "restricted") {
        db.prepare(
          "UPDATE users SET account_status = ? WHERE id = ?"
        ).run(action, report.author_id);
      }

      const updated = db
        .prepare(
          `SELECT r.id, r.reason, r.description, r.status,
                  r.created_at AS createdAt, r.reviewed_at AS reviewedAt,
                  p.id AS postId, p.content AS postContent, p.category AS postCategory,
                  p.created_at AS postCreatedAt,
                  author.id AS reportedUserId, author.name AS reportedUserName, author.email AS reportedUserEmail,
                  author.account_status AS reportedUserStatus,
                  reporter.id AS reporterId, reporter.name AS reporterName, reporter.email AS reporterEmail,
                  reviewer.name AS reviewerName
           FROM community_reports r
           JOIN community_posts p ON r.post_id = p.id
           JOIN users author ON p.author_id = author.id
           JOIN users reporter ON r.reporter_id = reporter.id
           LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
           WHERE r.id = ?`
        )
        .get(req.params.id);

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  }
);

// PATCH /api/admin/users/:id/status — manually ban/restrict/unban a user
router.patch(
  "/users/:id/status",
  requireAdmin,
  validate(UpdateUserStatusSchema),
  (req: Request, res: Response) => {
    try {
      if (req.params.id === req.user!.id) {
        res.status(400).json({ detail: "Cannot change your own account status." });
        return;
      }
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id);
      if (!user) {
        res.status(404).json({ detail: "User not found" });
        return;
      }
      db.prepare("UPDATE users SET account_status = ? WHERE id = ?").run(req.body.status, req.params.id);
      res.json({ id: req.params.id, accountStatus: req.body.status });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  }
);

export default router;
