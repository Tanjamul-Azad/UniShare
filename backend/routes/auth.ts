import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import db from "../db/index.js";
import admin from "../lib/firebaseAdmin.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, generateToken } from "../middleware/auth.js";
import { formatUser } from "../utils.js";

const router = Router();
console.log("[auth] Router initialized");

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  uiuEmail: z.string().email().optional(),
  uiuIdNumber: z.string().optional(),
  uiuIdImage: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  requiredRole: z.enum(["user", "admin"]).optional(),
});

// POST /api/auth/register
router.post(
  "/register",
  validate(RegisterSchema),
  (req: Request, res: Response) => {
    try {
      const { name, email, password, uiuEmail, uiuIdNumber, uiuIdImage } =
        req.body;

      const existing = db
        .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
        .get(email);
      if (existing) {
        res.status(409).json({ detail: "Email already registered" });
        return;
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const userId = crypto.randomUUID();
      const joinedDate = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const hasVerificationData = !!(uiuEmail && uiuIdNumber && uiuIdImage);
      const verificationStatus = hasVerificationData ? "pending" : "unverified";
      const now = new Date().toISOString();

      db.prepare(
        `
      INSERT INTO users
        (id, name, email, password_hash, role, verification_status,
         uiu_email, uiu_id_number, uiu_id_image, verification_submitted_at, joined_date)
      VALUES (?, ?, ?, ?, 'user', ?, ?, ?, ?, ?, ?)
    `,
      ).run(
        userId,
        name,
        email,
        passwordHash,
        verificationStatus,
        uiuEmail ?? null,
        uiuIdNumber ?? null,
        uiuIdImage ?? null,
        hasVerificationData ? now : null,
        joinedDate,
      );

      if (hasVerificationData) {
        db.prepare(
          `
        INSERT INTO verification_requests
          (id, user_id, uiu_email, uiu_id_number, uiu_id_image, status, submitted_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `,
        ).run(
          crypto.randomUUID(),
          userId,
          uiuEmail,
          uiuIdNumber,
          uiuIdImage,
          now,
        );
      }

      const user = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(userId) as any;
      const token = generateToken({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verification_status,
      });

      res.status(201).json({ user: formatUser(user), token });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

// POST /api/auth/login
router.post("/login", validate(LoginSchema), (req: Request, res: Response) => {
  try {
    const { email, password, requiredRole } = req.body;

    const user = db
      .prepare(
        "SELECT * FROM users WHERE lower(email) = lower(?) OR lower(uiu_email) = lower(?)",
      )
      .get(email, email) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ detail: "Invalid email or password" });
      return;
    }

    // Role Enforcement
    if (requiredRole && user.role !== requiredRole) {
      const msg = requiredRole === "admin" 
        ? "This account does not have administrative privileges." 
        : "Administrative accounts must sign in through the Admin Portal.";
      res.status(403).json({ detail: msg });
      return;
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verification_status,
    });

    res.json({ user: formatUser(user), token });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/auth/social-login
router.post("/social-login", async (req: Request, res: Response) => {
  try {
    const { idToken, provider, requiredRole } = req.body;

    // 1. Verify Firebase Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    if (!email) {
      res.status(400).json({ detail: "Email not provided by social provider" });
      return;
    }

    // 2. Find or Create User in local DB
    let user = db
      .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
      .get(email) as any;

    if (!user) {
      // Social login is for 'user' role only by default
      if (requiredRole === 'admin') {
        res.status(403).json({ detail: "Administrative accounts must be created by an existing administrator." });
        return;
      }

      const userId = crypto.randomUUID();
      const joinedDate = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      db.prepare(
        `
        INSERT INTO users
          (id, name, email, role, verification_status, joined_date)
        VALUES (?, ?, ?, 'user', 'unverified', ?)
      `,
      ).run(userId, name || provider + " User", email, joinedDate);

      user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    }

    // Role Enforcement for Social Login
    if (requiredRole && user.role !== requiredRole) {
      const msg = requiredRole === "admin" 
        ? "This account does not have administrative privileges." 
        : "Administrative accounts must sign in through the Admin Portal.";
      res.status(403).json({ detail: msg });
      return;
    }

    // 3. Generate UniShare Token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verification_status,
    });

    res.json({ user: formatUser(user), token });
  } catch (err: any) {
    console.error("Social login error:", err);
    res.status(401).json({ detail: "Invalid social token or verification failed" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: Request, res: Response) => {
  try {
    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.user!.id) as any;
    if (!user) {
      res.status(404).json({ detail: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/auth/update-password
router.post("/update-password", requireAuth, (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      res.status(400).json({ detail: "Password must be at least 6 characters" });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      passwordHash,
      req.user!.id
    );

    res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
