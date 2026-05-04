import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import db from "../db/index.js";

const router = Router();

// GET /api/messages?participant=<userId>&page=1&limit=50
// Fetch paginated messages for a conversation thread
router.get("/", requireAuth, (req, res) => {
  const userId = req.user!.id;
  const participantId = req.query.participant as string | undefined;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const offset = (page - 1) * limit;

  if (!participantId) {
    // Return conversation list (last message per participant)
    const conversations = db
      .prepare(
        `SELECT
          CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS participantId,
          u.name AS participantName,
          u.avatar AS participantAvatar,
          m.content AS lastMessage,
          m.created_at AS lastTimestamp,
          SUM(CASE WHEN m.receiver_id = ? AND m.read = 0 AND m.deleted_at IS NULL THEN 1 ELSE 0 END) AS unreadCount
        FROM messages m
        LEFT JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
        WHERE (m.sender_id = ? OR m.receiver_id = ?)
        GROUP BY participantId
        ORDER BY m.created_at DESC`
      )
      .all(userId, userId, userId, userId, userId) as any[];

    return res.json({ conversations });
  }

  // Thread between two users
  const messages = db
    .prepare(
      `SELECT m.id, m.sender_id AS senderId, m.receiver_id AS receiverId,
              m.content, m.read, m.created_at AS timestamp,
              m.reply_to AS replyToId, m.edited_at AS editedAt,
              m.deleted_at AS deletedAt,
              su.name AS senderName, ru.name AS receiverName,
              rm.content AS replyToContent,
              rsu.name AS replyToSenderName
       FROM messages m
       LEFT JOIN users su ON m.sender_id = su.id
       LEFT JOIN users ru ON m.receiver_id = ru.id
       LEFT JOIN messages rm ON rm.id = m.reply_to
       LEFT JOIN users rsu ON rm.sender_id = rsu.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(userId, participantId, participantId, userId, limit, offset) as any[];

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) as count FROM messages m
         WHERE (m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?)`
      )
      .get(userId, participantId, participantId, userId) as any
  ).count as number;

  // Attach reactions
  const messageIds = messages.map((m) => m.id);
  const reactions =
    messageIds.length > 0
      ? (db
          .prepare(
            `SELECT message_id AS messageId, user_id AS userId, emoji
             FROM message_reactions
             WHERE message_id IN (${messageIds.map(() => "?").join(",")})`
          )
          .all(...messageIds) as any[])
      : [];

  const reactionMap = reactions.reduce((acc: Record<string, any[]>, r) => {
    if (!acc[r.messageId]) acc[r.messageId] = [];
    acc[r.messageId].push({ userId: r.userId, emoji: r.emoji });
    return acc;
  }, {});

  const hydrated = messages.reverse().map((m) => ({
    ...m,
    reactions: reactionMap[m.id] ?? [],
  }));

  res.json({ messages: hydrated, total, page, limit });
});

export default router;
