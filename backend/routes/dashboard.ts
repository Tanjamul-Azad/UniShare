import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import db from "../db/index.js";

const router = Router();

router.get("/stats", requireAuth, (req, res) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';

  // Personal Stats
  const listingsCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM marketplace_items WHERE seller_id = ? AND is_active = 1")
      .get(userId) as any
  ).count as number;

  const groupsCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM subscription_groups WHERE owner_id = ? AND is_active = 1")
      .get(userId) as any
  ).count as number;

  const ordersCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM orders WHERE buyer_id = ?")
      .get(userId) as any
  ).count as number;

  const savedCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM favorites WHERE user_id = ?")
      .get(userId) as any
  ).count as number;

  const unreadMessages = (
    db
      .prepare("SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0 AND deleted_at IS NULL")
      .get(userId) as any
  ).count as number;

  const unreadNotifications = (
    db
      .prepare("SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND read = 0")
      .get(userId) as any
  ).count as number;

  // Pending borrow + trade requests awaiting my response (on items I own)
  const pendingRequestsCount = (
    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM borrow_requests br
              JOIN marketplace_items m ON br.item_id = m.id
              WHERE m.seller_id = ? AND br.status = 'pending')
         + (SELECT COUNT(*) FROM trade_proposals tp
              JOIN marketplace_items m ON tp.item_id = m.id
              WHERE m.seller_id = ? AND tp.status = 'pending') AS count`,
      )
      .get(userId, userId) as any
  ).count as number;

  // Global Stats (only for admins)
  let globalStats = null;
  if (isAdmin) {
    const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
    const totalListings = (db.prepare("SELECT COUNT(*) as count FROM marketplace_items WHERE is_active = 1").get() as any).count;
    const pendingVerifications = (db.prepare("SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'").get() as any).count;
    
    globalStats = {
      totalUsers,
      totalListings,
      pendingVerifications
    };
  }

  const recentNotifications = db
    .prepare(
      `SELECT id, type, title, message, read, link_url AS linkUrl, created_at AS createdAt
       FROM notifications
       WHERE recipient_id = ?
       ORDER BY created_at DESC
       LIMIT 5`
    )
    .all(userId) as any[];

  const recentActivity = db
    .prepare(
      `SELECT o.id, o.total_amount AS totalAmount, o.status, o.created_at AS createdAt,
              COUNT(oi.id) AS itemCount
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.buyer_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 3`
    )
    .all(userId) as any[];

  res.json({
    listingsCount,
    groupsCount,
    ordersCount,
    savedCount,
    unreadMessages,
    unreadNotifications,
    pendingRequestsCount,
    recentNotifications,
    recentActivity,
    globalStats
  });
});

export default router;
