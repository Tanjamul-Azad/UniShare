import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import db from "../db/index.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { formatUser } from "../utils.js";

const router = Router();

const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  university: z.string().optional(),
  major: z.string().optional(),
  graduationYear: z.string().optional(),
  avatar: z.string().optional(),
});

const SubmitVerificationSchema = z.object({
  uiuEmail: z.string().email(),
  uiuIdNumber: z.string().min(1),
  uiuIdImage: z.string().min(1),
});

// GET /api/users/by-email/?email=
router.get("/by-email/", requireAuth, (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ detail: "email query param required" });
      return;
    }
    if (req.user?.role !== "admin" && req.user?.email.toLowerCase() !== email) {
      res.status(403).json({ detail: "Forbidden" });
      return;
    }
    const user = db
      .prepare(
        "SELECT * FROM users WHERE lower(email) = ? OR lower(uiu_email) = ?",
      )
      .get(email, email) as any;
    if (!user) {
      res.status(404).json({ detail: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/users/ — admin only
router.get("/", requireAdmin, (_req: Request, res: Response) => {
  try {
    const users = db
      .prepare("SELECT * FROM users ORDER BY created_at DESC")
      .all() as any[];
    res.json(users.map(formatUser));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as any;
    if (!user) {
      res.status(404).json({ detail: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// PUT /api/users/:id — owner or admin
router.put(
  "/:id",
  requireAuth,
  validate(UpdateProfileSchema),
  (req: Request, res: Response) => {
    try {
      if (req.user!.id !== req.params.id && req.user!.role !== "admin") {
        res.status(403).json({ detail: "Forbidden" });
        return;
      }
      const {
        name,
        phone,
        address,
        bio,
        university,
        major,
        graduationYear,
        avatar,
      } = req.body;
      db.prepare(
        `
      UPDATE users SET
        name            = COALESCE(?, name),
        phone           = COALESCE(?, phone),
        address         = COALESCE(?, address),
        bio             = COALESCE(?, bio),
        university      = COALESCE(?, university),
        major           = COALESCE(?, major),
        graduation_year = COALESCE(?, graduation_year),
        avatar          = COALESCE(?, avatar)
      WHERE id = ?
    `,
      ).run(
        name ?? null,
        phone ?? null,
        address ?? null,
        bio ?? null,
        university ?? null,
        major ?? null,
        graduationYear ?? null,
        avatar ?? null,
        req.params.id,
      );
      const updated = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(req.params.id) as any;
      res.json(formatUser(updated));
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// DELETE /api/users/:id — admin only
router.delete("/:id", requireAdmin, (req: Request, res: Response) => {
  try {
    const existing = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ detail: "User not found" });
      return;
    }
    // Don't allow deleting yourself
    if (existing.id === req.user!.id) {
      res.status(400).json({ detail: "Cannot delete your own admin account" });
      return;
    }
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/users/:id/verify
router.post(
  "/:id/verify",
  requireAuth,
  validate(SubmitVerificationSchema),
  (req: Request, res: Response) => {
    try {
      if (req.user!.id !== req.params.id) {
        res.status(403).json({ detail: "Forbidden" });
        return;
      }

      const { uiuEmail, uiuIdNumber, uiuIdImage } = req.body;
      const now = new Date().toISOString();

      db.prepare(
        `
        UPDATE users SET 
          uiu_email = ?,
          uiu_id_number = ?,
          uiu_id_image = ?,
          verification_status = 'pending',
          verification_submitted_at = ?
        WHERE id = ?
      `,
      ).run(uiuEmail, uiuIdNumber, uiuIdImage, now, req.params.id);

      db.prepare(
        `
        INSERT INTO verification_requests (id, user_id, uiu_email, uiu_id_number, uiu_id_image, status, submitted_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `,
      ).run(
        crypto.randomUUID(),
        req.params.id,
        uiuEmail,
        uiuIdNumber,
        uiuIdImage,
        now,
      );

      const updated = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(req.params.id) as any;
      res.json(formatUser(updated));
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// PATCH /api/users/:id/role — admin only
router.patch("/:id/role", requireAdmin, (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      res.status(400).json({ detail: "Invalid role" });
      return;
    }
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(
      role,
      req.params.id,
    );
    const updated = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id) as any;
    res.json(formatUser(updated));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
