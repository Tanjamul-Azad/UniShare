import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getIo } from "../socket/emitter.js";

const router = Router();

const REQUESTS_LINK = "/dashboard/requests";

const BorrowRequestSchema = z.object({
  itemId: z.string().min(1),
  message: z.string().optional(),
});

const TradeProposalSchema = z.object({
  itemId: z.string().min(1),
  offerDescription: z.string().min(1),
});

const ReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "borrowed", "returned", "completed"]),
});

type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "borrowed"
  | "returned"
  | "completed";

// Owner-driven state machines. Each maps a current status to its allowed next ones.
const BORROW_TRANSITIONS: Record<string, RequestStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["borrowed"],
  borrowed: ["returned"],
};

const TRADE_TRANSITIONS: Record<string, RequestStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["completed"],
};

// Notification copy keyed by the target status, for each request kind.
function reviewNotification(
  kind: "borrow" | "trade",
  status: RequestStatus,
  ownerName: string,
  itemTitle: string,
): { title: string; message: string } {
  const who = ownerName || "The owner";
  if (kind === "borrow") {
    switch (status) {
      case "approved":
        return {
          title: "Borrow request approved",
          message: `${who} approved your request to borrow "${itemTitle}".`,
        };
      case "rejected":
        return {
          title: "Borrow request declined",
          message: `${who} declined your request to borrow "${itemTitle}".`,
        };
      case "borrowed":
        return {
          title: "Item handed over",
          message: `${who} marked "${itemTitle}" as handed over. Enjoy — remember to return it!`,
        };
      case "returned":
        return {
          title: "Borrow completed",
          message: `${who} confirmed the return of "${itemTitle}". Thanks for sharing!`,
        };
    }
  } else {
    switch (status) {
      case "approved":
        return {
          title: "Trade proposal accepted",
          message: `${who} accepted your trade for "${itemTitle}". Coordinate the swap in chat.`,
        };
      case "rejected":
        return {
          title: "Trade proposal declined",
          message: `${who} declined your trade for "${itemTitle}".`,
        };
      case "completed":
        return {
          title: "Trade completed",
          message: `${who} marked your trade for "${itemTitle}" as completed.`,
        };
    }
  }
  return { title: "Request updated", message: `Your request for "${itemTitle}" was updated.` };
}

// Persist a notification and push it live to the recipient (if connected).
function notify(
  recipientId: string,
  type: string,
  title: string,
  message: string,
  linkUrl: string,
) {
  const notifId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const timestamp = new Date().toISOString();
  db.prepare(
    `INSERT INTO notifications (id, recipient_id, type, title, message, link_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(notifId, recipientId, type, title, message, linkUrl, timestamp);

  const io = getIo();
  if (io) {
    io.to(recipientId).emit("receive_notification", {
      id: notifId,
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

// ── POST /api/borrow-requests/ — create borrow request ─────────────────────
router.post(
  "/borrow-requests/",
  requireAuth,
  validate(BorrowRequestSchema),
  (req: Request, res: Response) => {
    try {
      if (req.user?.role === "admin") {
        res.status(403).json({ detail: "Administrators cannot submit borrow requests." });
        return;
      }
      const { itemId, message } = req.body;
      const requesterId = req.user!.id;

      const item = db
        .prepare(
          "SELECT id, seller_id, title FROM marketplace_items WHERE id = ? AND is_active = 1",
        )
        .get(itemId) as any;
      if (!item) {
        res.status(404).json({ detail: "Item not found" });
        return;
      }

      if (item.seller_id === requesterId) {
        res.status(400).json({ detail: "You cannot borrow your own items" });
        return;
      }

      const existing = db
        .prepare(
          "SELECT id FROM borrow_requests WHERE requester_id = ? AND item_id = ? AND status = 'pending'",
        )
        .get(requesterId, itemId);
      if (existing) {
        res
          .status(400)
          .json({ detail: "You already have a pending request for this item" });
        return;
      }

      const requestId = `br-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      db.prepare(
        "INSERT INTO borrow_requests (id, requester_id, item_id, message, status) VALUES (?, ?, ?, ?, 'pending')",
      ).run(requestId, requesterId, itemId, message || null);

      notify(
        item.seller_id,
        "request",
        "New borrow request",
        `${req.user!.name || "Someone"} wants to borrow "${item.title}".`,
        REQUESTS_LINK,
      );

      res.status(201).json({
        id: requestId,
        requesterId,
        itemId,
        status: "pending",
        message,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── POST /api/trade-proposals/ — create trade proposal ─────────────────────
router.post(
  "/trade-proposals/",
  requireAuth,
  validate(TradeProposalSchema),
  (req: Request, res: Response) => {
    try {
      if (req.user?.role === "admin") {
        res.status(403).json({ detail: "Administrators cannot submit trade proposals." });
        return;
      }
      const { itemId, offerDescription } = req.body;
      const proposerId = req.user!.id;

      const item = db
        .prepare(
          "SELECT id, seller_id, title FROM marketplace_items WHERE id = ? AND is_active = 1",
        )
        .get(itemId) as any;
      if (!item) {
        res.status(404).json({ detail: "Item not found" });
        return;
      }

      if (item.seller_id === proposerId) {
        res.status(400).json({ detail: "You cannot trade your own items" });
        return;
      }

      const existing = db
        .prepare(
          "SELECT id FROM trade_proposals WHERE proposer_id = ? AND item_id = ? AND status = 'pending'",
        )
        .get(proposerId, itemId);
      if (existing) {
        res
          .status(400)
          .json({ detail: "You already have a pending proposal for this item" });
        return;
      }

      const proposalId = `tp-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      db.prepare(
        "INSERT INTO trade_proposals (id, proposer_id, item_id, offer_description, status) VALUES (?, ?, ?, ?, 'pending')",
      ).run(proposalId, proposerId, itemId, offerDescription);

      notify(
        item.seller_id,
        "trade",
        "New trade proposal",
        `${req.user!.name || "Someone"} proposed a trade for "${item.title}".`,
        REQUESTS_LINK,
      );

      res.status(201).json({
        id: proposalId,
        proposerId,
        itemId,
        offerDescription,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── GET /api/borrow-requests/ — requests I have sent (as requester) ────────
router.get("/borrow-requests/", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const requests = db
      .prepare(
        `SELECT br.id, br.requester_id AS requesterId, br.item_id AS itemId,
                br.status, br.message, br.created_at AS createdAt,
                br.reviewed_at AS reviewedAt,
                m.title AS itemTitle, m.image_url AS itemImage, m.type AS itemType,
                m.seller_id AS ownerId, o.name AS ownerName
         FROM borrow_requests br
         JOIN marketplace_items m ON br.item_id = m.id
         JOIN users o ON m.seller_id = o.id
         WHERE br.requester_id = ?
         ORDER BY br.created_at DESC`,
      )
      .all(userId) as any[];
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ── GET /api/trade-proposals/ — proposals I have sent (as proposer) ────────
router.get("/trade-proposals/", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const proposals = db
      .prepare(
        `SELECT tp.id, tp.proposer_id AS requesterId, tp.item_id AS itemId,
                tp.offer_description AS offerDescription, tp.status,
                tp.created_at AS createdAt, tp.reviewed_at AS reviewedAt,
                m.title AS itemTitle, m.image_url AS itemImage, m.type AS itemType,
                m.seller_id AS ownerId, o.name AS ownerName
         FROM trade_proposals tp
         JOIN marketplace_items m ON tp.item_id = m.id
         JOIN users o ON m.seller_id = o.id
         WHERE tp.proposer_id = ?
         ORDER BY tp.created_at DESC`,
      )
      .all(userId) as any[];
    res.json(proposals);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ── GET /api/borrow-requests/incoming — requests on items I own ────────────
router.get(
  "/borrow-requests/incoming",
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const ownerId = req.user!.id;
      const requests = db
        .prepare(
          `SELECT br.id, br.requester_id AS requesterId, br.item_id AS itemId,
                  br.status, br.message, br.created_at AS createdAt,
                  br.reviewed_at AS reviewedAt,
                  m.title AS itemTitle, m.image_url AS itemImage, m.type AS itemType,
                  u.name AS requesterName, u.avatar AS requesterAvatar
           FROM borrow_requests br
           JOIN marketplace_items m ON br.item_id = m.id
           JOIN users u ON br.requester_id = u.id
           WHERE m.seller_id = ?
           ORDER BY (br.status = 'pending') DESC, br.created_at DESC`,
        )
        .all(ownerId) as any[];
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── GET /api/trade-proposals/incoming — proposals on items I own ───────────
router.get(
  "/trade-proposals/incoming",
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const ownerId = req.user!.id;
      const proposals = db
        .prepare(
          `SELECT tp.id, tp.proposer_id AS requesterId, tp.item_id AS itemId,
                  tp.offer_description AS offerDescription, tp.status,
                  tp.created_at AS createdAt, tp.reviewed_at AS reviewedAt,
                  m.title AS itemTitle, m.image_url AS itemImage, m.type AS itemType,
                  u.name AS requesterName, u.avatar AS requesterAvatar
           FROM trade_proposals tp
           JOIN marketplace_items m ON tp.item_id = m.id
           JOIN users u ON tp.proposer_id = u.id
           WHERE m.seller_id = ?
           ORDER BY (tp.status = 'pending') DESC, tp.created_at DESC`,
        )
        .all(ownerId) as any[];
      res.json(proposals);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── PATCH /api/borrow-requests/:id — owner advances the borrow lifecycle ───
//    pending → approved | rejected,  approved → borrowed,  borrowed → returned
router.patch(
  "/borrow-requests/:id",
  requireAuth,
  validate(ReviewSchema),
  (req: Request, res: Response) => {
    try {
      const ownerId = req.user!.id;
      const status = req.body.status as RequestStatus;

      const row = db
        .prepare(
          `SELECT br.id, br.requester_id AS requesterId, br.status,
                  m.seller_id AS ownerId, m.title AS itemTitle
           FROM borrow_requests br
           JOIN marketplace_items m ON br.item_id = m.id
           WHERE br.id = ?`,
        )
        .get(req.params.id) as any;

      if (!row) {
        res.status(404).json({ detail: "Request not found" });
        return;
      }
      if (row.ownerId !== ownerId) {
        res
          .status(403)
          .json({ detail: "You can only manage requests for your own items" });
        return;
      }

      const allowed = BORROW_TRANSITIONS[row.status] ?? [];
      if (!allowed.includes(status)) {
        res.status(400).json({
          detail: `Cannot change a "${row.status}" request to "${status}".`,
        });
        return;
      }

      const reviewedAt = new Date().toISOString();
      db.prepare(
        "UPDATE borrow_requests SET status = ?, reviewed_at = ? WHERE id = ?",
      ).run(status, reviewedAt, req.params.id);

      const note = reviewNotification("borrow", status, req.user!.name, row.itemTitle);
      notify(row.requesterId, "request", note.title, note.message, REQUESTS_LINK);

      res.json({ id: row.id, status, reviewedAt });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// ── PATCH /api/trade-proposals/:id — owner advances the trade lifecycle ────
//    pending → approved | rejected,  approved → completed
router.patch(
  "/trade-proposals/:id",
  requireAuth,
  validate(ReviewSchema),
  (req: Request, res: Response) => {
    try {
      const ownerId = req.user!.id;
      const status = req.body.status as RequestStatus;

      const row = db
        .prepare(
          `SELECT tp.id, tp.proposer_id AS requesterId, tp.status,
                  m.seller_id AS ownerId, m.title AS itemTitle
           FROM trade_proposals tp
           JOIN marketplace_items m ON tp.item_id = m.id
           WHERE tp.id = ?`,
        )
        .get(req.params.id) as any;

      if (!row) {
        res.status(404).json({ detail: "Proposal not found" });
        return;
      }
      if (row.ownerId !== ownerId) {
        res
          .status(403)
          .json({ detail: "You can only manage proposals for your own items" });
        return;
      }

      const allowed = TRADE_TRANSITIONS[row.status] ?? [];
      if (!allowed.includes(status)) {
        res.status(400).json({
          detail: `Cannot change a "${row.status}" proposal to "${status}".`,
        });
        return;
      }

      const reviewedAt = new Date().toISOString();
      db.prepare(
        "UPDATE trade_proposals SET status = ?, reviewed_at = ? WHERE id = ?",
      ).run(status, reviewedAt, req.params.id);

      const note = reviewNotification("trade", status, req.user!.name, row.itemTitle);
      notify(row.requesterId, "trade", note.title, note.message, REQUESTS_LINK);

      res.json({ id: row.id, status, reviewedAt });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

export default router;
