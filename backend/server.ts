import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Boot DB and run migrations on startup
import "./db/index.js";

import { initSocket } from "./socket/index.js";
import { setIo } from "./socket/emitter.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import marketplaceRouter from "./routes/marketplace.js";
import cosubsRouter from "./routes/cosubs.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";
import verificationsRouter from "./routes/verifications.js";
import reviewsRouter from "./routes/reviews.js";
import favoritesRouter from "./routes/favorites.js";
import sellerRouter from "./routes/seller.js";
import requestsRouter from "./routes/requests.js";
import dashboardRouter from "./routes/dashboard.js";
import notificationsRouter from "./routes/notifications.js";
import messagesRouter from "./routes/messages.js";
import adminRouter from "./routes/admin.js";
import sslcommerzRouter from "./routes/sslcommerz.js";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // expose io to routes that need to emit notifications
  setIo(io);

  const PORT = Number(process.env.PORT ?? "3000");

  // ── Body parsing (10 mb limit for base64 ID images) ───────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Development CSP & Well-Known Path Fix ───────────────────────────
  app.use((req, res, next) => {
    // Relax CSP for development to allow HMR, WebSockets, and local API calls
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    
    // Log API requests for debugging
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.originalUrl}`);
    }

    // Handle Chrome DevTools noise silently
    if (req.path.includes('com.chrome.devtools.json')) {
      return res.status(200).json({});
    }
    next();
  });

  // ── REST API routes ────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/marketplace", marketplaceRouter);
  app.use("/api/co-subs", cosubsRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/verifications", verificationsRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/seller", sellerRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/payment", sslcommerzRouter);

  // Catch-all for missing API routes to log them clearly
  app.use("/api/*", (req, res) => {
    console.warn(`[404] API Route Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ detail: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // ── Socket.IO (authenticated, per-user rooms, DB-backed) ──────────
  initSocket(io);

  // ── Vite dev middleware / static production build ─────────────────
  if (process.env.NODE_ENV !== "production" && process.env.SKIP_VITE !== "true") {
    console.log("[server] Starting Vite in middleware mode...");
    const vite = await createViteServer({
      root: path.join(process.cwd(), "frontend"),
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: "spa",
      configFile: path.join(process.cwd(), "frontend", "vite.config.ts"),
    });
    console.log("[server] Vite middleware initialized.");
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      // Don't handle API routes here
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }

      try {
        let template = fs.readFileSync(
          path.resolve(process.cwd(), "frontend", "index.html"),
          "utf-8",
        );
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(distPath, "index.html")),
    );
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
