import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import db from "../db/index.js";
import admin from "../lib/firebaseAdmin.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, generateToken } from "../middleware/auth.js";
import { formatUser } from "../utils.js";
import { sendMail, buildPasswordResetEmail } from "../lib/mailer.js";

const sha256 = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const ForgotPasswordSchema = z.object({ email: z.string().email() });
const ResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

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

// POST /api/auth/forgot-password — issue a reset token + email the link
router.post(
  "/forgot-password",
  validate(ForgotPasswordSchema),
  async (req: Request, res: Response) => {
    // Always respond the same way so we never reveal which emails exist.
    const generic = {
      message:
        "If an account exists for that email, we've sent a password reset link.",
    };
    try {
      const { email } = req.body;
      const user = db
        .prepare(
          "SELECT * FROM users WHERE lower(email) = lower(?) OR lower(uiu_email) = lower(?)",
        )
        .get(email, email) as any;

      // Only email/password accounts can reset (Google accounts have no password).
      if (user && user.password_hash) {
        // Invalidate any previous tokens for this user
        db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(
          user.id,
        );

        const rawToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        db.prepare(
          `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
           VALUES (?, ?, ?, ?)`,
        ).run(crypto.randomUUID(), user.id, sha256(rawToken), expiresAt);

        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const link = `${appUrl}/#/reset-password?token=${rawToken}`;
        const mail = buildPasswordResetEmail(user.name, link);
        try {
          await sendMail({ ...mail, to: user.email });
        } catch (mailErr) {
          console.error("[auth] Failed to send reset email:", mailErr);
        }
      }

      res.json(generic);
    } catch (err: any) {
      // Still respond generically; log the real error server-side.
      console.error("[auth] forgot-password error:", err);
      res.json(generic);
    }
  },
);

// POST /api/auth/reset-password — consume a token + set a new password
router.post(
  "/reset-password",
  validate(ResetPasswordSchema),
  (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      const row = db
        .prepare(
          "SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0",
        )
        .get(sha256(token)) as any;

      if (!row) {
        res.status(400).json({ detail: "Invalid or already-used reset link." });
        return;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        res.status(400).json({ detail: "This reset link has expired. Please request a new one." });
        return;
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const tx = db.transaction(() => {
        db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
          passwordHash,
          row.user_id,
        );
        db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(
          row.id,
        );
        // Clean up any other outstanding tokens for this user
        db.prepare(
          "DELETE FROM password_reset_tokens WHERE user_id = ? AND id != ?",
        ).run(row.user_id, row.id);
      });
      tx();

      res.json({ message: "Your password has been reset. You can now sign in." });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

export default router;
