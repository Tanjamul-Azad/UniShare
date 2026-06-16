import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../db/index.js";

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
}

// Augment Express so req.user is typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const JWT_SECRET =
  process.env.JWT_SECRET ?? "unishare-dev-secret-change-in-prod";

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Authentication required" });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
    // Fetch fresh user data to prevent stale JWT bugs (e.g. verification status changes)
    const dbUser = db.prepare("SELECT role, verification_status, name, account_status FROM users WHERE id = ?").get(payload.id) as any;

    if (!dbUser) {
      res.status(401).json({ detail: "User no longer exists" });
      return;
    }

    if (dbUser.account_status === "banned") {
      res.status(403).json({ detail: "Your account has been banned. Please contact support." });
      return;
    }

    req.user = {
      ...payload,
      role: dbUser.role,
      verificationStatus: dbUser.verification_status,
      name: dbUser.name,
      accountStatus: dbUser.account_status ?? "active",
    } as any;
    next();
  } catch {
    res.status(401).json({ detail: "Invalid or expired token" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ detail: "Admin access required" });
      return;
    }
    next();
  });
}
