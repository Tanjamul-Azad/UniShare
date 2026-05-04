import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import db from "../db/index.js";

const router = Router();

// GET /api/notifications — fetch current user's notifications
router.get("/", requireAuth, (req, res) => {
  const userId = req.user!.id;
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = Number(req.query.offset ?? 0);

  const notifications = db
    .prepare(
      `SELECT id, type, title, message, read, link_url AS linkUrl, created_at AS createdAt
       FROM notifications
       WHERE recipient_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(userId, limit, offset) as any[];

  const total = (
    db
      .prepare("SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ?")
      .get(userId) as any
  ).count as number;

  res.json({ notifications, total });
});

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch("/:id/read", requireAuth, (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const result = db
    .prepare("UPDATE notifications SET read = 1 WHERE id = ? AND recipient_id = ?")
    .run(id, userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Notification not found" });
  }

  res.json({ success: true });
});

// PATCH /api/notifications/read-all — mark all as read
router.patch("/read-all", requireAuth, (req, res) => {
  const userId = req.user!.id;
  db.prepare("UPDATE notifications SET read = 1 WHERE recipient_id = ?").run(userId);
  res.json({ success: true });
});

export default router;
