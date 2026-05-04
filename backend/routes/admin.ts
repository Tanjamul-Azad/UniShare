import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import db from "../db/index.js";

const router = Router();

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
      recentVerifications,
      recentListings,
      recentUsers,
    });
  } catch (err: any) {
    console.error(`[admin] Error fetching stats: ${err.message}`);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
