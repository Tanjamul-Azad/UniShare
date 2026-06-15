import { Router, Request, Response } from "express";
import SSLCommerzPayment from "sslcommerz-lts";
import crypto from "crypto";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { emitNotification } from "../socket/index.js";

const router = Router();

const store_id = process.env.SSLCOMMERZ_STORE_ID || "test67c71e227038e";
const store_passwd =
  process.env.SSLCOMMERZ_STORE_PASSWORD || "test67c71e227038e@ssl";
const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

// Dynamically determine BASE_URL (backend) if not in env
const getBaseUrl = (req: Request) => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const host = req.get("host");
  const protocol = req.protocol;
  return `${protocol}://${host}`;
};

// Prefer explicit frontend URL, otherwise infer from request headers
const getFrontendBaseUrl = (req: Request) => {
  if (process.env.APP_URL) return process.env.APP_URL;
  const origin = req.get("origin");
  if (origin) return origin;
  const referer = req.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Ignore malformed referers
    }
  }
  return getBaseUrl(req);
};

const FEE_RATE = 0.05;

// POST /api/payment/init
router.post("/init", requireAuth, async (req: Request, res: Response) => {
  const buyerId = req.user!.id;
  console.log(`[SSLCommerz] Starting /init for user: ${buyerId}`);

  try {
    if (req.user?.verificationStatus !== "verified") {
      console.log(`[SSLCommerz] Blocked: User ${buyerId} is not verified.`);
      res
        .status(403)
        .json({ detail: "Only verified users can make purchases." });
      return;
    }

    const cartItems = db
      .prepare(
        `
      SELECT m.*, ci.id AS cart_id
      FROM marketplace_items m
      INNER JOIN cart_items ci ON ci.item_id = m.id
      WHERE ci.user_id = ? AND m.is_active = 1
    `,
      )
      .all(buyerId) as any[];

    console.log(`[SSLCommerz] Cart items for ${buyerId}:`, cartItems.length);

    if (cartItems.length === 0) {
      res.status(400).json({ detail: "Cart is empty" });
      return;
    }

    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + Number(item.price ?? 0),
      0,
    );
    const fee = Number((subtotal * FEE_RATE).toFixed(2));
    const total = Number((subtotal + fee).toFixed(2));
    console.log(
      `[SSLCommerz] Subtotal: ${subtotal}, Fee: ${fee}, Total: ${total}`,
    );

    const tran_id =
      "UNI-" +
      Math.random().toString(36).substring(2, 10).toUpperCase() +
      Date.now().toString().slice(-4);
    console.log(`[SSLCommerz] Generated Tran ID: ${tran_id}`);

    // MOCK GATEWAY LOGIC
    if (
      !process.env.SSLCOMMERZ_STORE_ID ||
      process.env.SSLCOMMERZ_STORE_ID === "test67c71e227038e" ||
      process.env.SSLCOMMERZ_STORE_ID === "testbox"
    ) {
      console.log(`[SSLCommerz] Entering Mock Mode`);
      db.prepare(
        `INSERT INTO orders (id, buyer_id, total_amount, fee, status, tran_id) VALUES (?, ?, ?, ?, 'pending', ?)`,
      ).run(tran_id, buyerId, total, fee, tran_id);

      for (const item of cartItems) {
        db.prepare(
          `INSERT INTO order_items (id, order_id, item_id, price_at_purchase) VALUES (?, ?, ?, ?)`,
        ).run(
          Math.random().toString(36).substring(2, 15),
          tran_id,
          item.id,
          item.price ?? 0,
        );
      }

      const preferredMethod = req.body.method || "card";
      const mockUrl = `${getFrontendBaseUrl(req)}/#/mock-gateway?tran_id=${tran_id}&total=${total}&method=${preferredMethod}`;
      console.log(`[SSLCommerz] Mock URL: ${mockUrl}`);
      res.json({ url: mockUrl });
      return;
    }

    console.log(`[SSLCommerz] Entering Real Mode with Store ID: ${store_id}`);
    const data = {
      total_amount: total,
      currency: "BDT",
      tran_id: tran_id,
      success_url: `${getBaseUrl(req)}/api/payment/success`,
      fail_url: `${getBaseUrl(req)}/api/payment/fail`,
      cancel_url: `${getBaseUrl(req)}/api/payment/cancel`,
      ipn_url: `${getBaseUrl(req)}/api/payment/ipn`,
      shipping_method: "NO",
      product_name: "UniShare Purchase",
      product_category: "Marketplace",
      product_profile: "general",
      cus_name: req.user!.name,
      cus_email: req.user!.email,
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: "01700000000",
      ship_name: req.user!.name,
      ship_add1: "Dhaka",
      ship_city: "Dhaka",
      ship_postcode: "1000",
      ship_country: "Bangladesh",
    };

    const SSLCP = (SSLCommerzPayment as any).default || SSLCommerzPayment;
    if (typeof SSLCP !== "function") {
      throw new Error(
        "SSLCommerzPayment is not a constructor. Check package version and import.",
      );
    }

    const sslcz = new (SSLCP as any)(store_id, store_passwd, is_live);

    console.log(`[SSLCommerz] Calling sslcz.init...`);
    const apiResponse = await sslcz.init(data);
    console.log(
      "[SSLCommerz] API Response:",
      JSON.stringify(apiResponse, null, 2),
    );

    if (apiResponse?.GatewayPageURL) {
      db.prepare(
        `INSERT INTO orders (id, buyer_id, total_amount, fee, status, tran_id) VALUES (?, ?, ?, ?, 'pending', ?)`,
      ).run(tran_id, buyerId, total, fee, tran_id);

      for (const item of cartItems) {
        db.prepare(
          `INSERT INTO order_items (id, order_id, item_id, price_at_purchase) VALUES (?, ?, ?, ?)`,
        ).run(
          Math.random().toString(36).substring(2, 15),
          tran_id,
          item.id,
          item.price ?? 0,
        );
      }

      res.json({ url: apiResponse.GatewayPageURL });
    } else {
      res
        .status(400)
        .json({
          detail:
            "Failed to initiate payment: " +
            (apiResponse?.failedreason || "Unknown error"),
        });
    }
  } catch (err: any) {
    console.error("[SSLCommerz] CRITICAL ERROR:", err);
    res.status(500).json({ detail: err.message || "Internal server error" });
  }
});

// POST /api/payment/success
router.post("/success", async (req: Request, res: Response) => {
  const { tran_id, val_id } = req.body;
  console.log(
    `[Payment] Success callback received. Tran: ${tran_id}, Val: ${val_id}`,
  );

  try {
    let validation;
    if (val_id && val_id.startsWith("MOCK_VAL_")) {
      console.log(`[Payment] Bypassing validation for mock payment: ${val_id}`);
      validation = { status: "VALID" };
    } else {
      console.log(`[Payment] Validating real payment with SSLCommerz...`);
      const sslcz = new (SSLCommerzPayment as any)(
        store_id,
        store_passwd,
        is_live,
      );
      validation = await sslcz.validate({ val_id });
      console.log(
        `[Payment] SSLCommerz Validation Status: ${validation.status}`,
      );
    }

    if (
      validation.status === "VALID" ||
      validation.status === "AUTHENTICATED"
    ) {
      console.log(
        `[Payment] Validation successful. Proceeding with order fulfillment...`,
      );
      // 1. Update main order status
      db.prepare(
        "UPDATE orders SET status = 'paid', ssl_status = ?, val_id = ? WHERE id = ?",
      ).run(validation.status, val_id, tran_id);

      // 2. Set items to 'processing'
      db.prepare(
        "UPDATE order_items SET status = 'processing' WHERE order_id = ?",
      ).run(tran_id);

      // 3. Notify Sellers (Items stay active as sellers may have more pieces)
      const order = db
        .prepare("SELECT buyer_id FROM orders WHERE id = ?")
        .get(tran_id) as any;
      if (order) {
        console.log(`[Payment] Clearing cart for buyer: ${order.buyer_id}`);
        db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(
          order.buyer_id,
        );
        console.log(`[Payment] Cart cleared for buyer: ${order.buyer_id}`);

        // Fetch unique sellers in this order
        const sellers = db
          .prepare(
            `
          SELECT DISTINCT m.seller_id, m.title, u.name as buyer_name
          FROM order_items oi
          JOIN marketplace_items m ON oi.item_id = m.id
          JOIN orders o ON o.id = oi.order_id
          JOIN users u ON u.id = o.buyer_id
          WHERE oi.order_id = ?
        `,
          )
          .all(tran_id) as any[];

        for (const s of sellers) {
          const notifId = crypto.randomUUID();
          const timestamp = new Date().toISOString();
          const message = `${s.buyer_name} purchased your item: ${s.title}. Please confirm the order.`;
          db.prepare(
            `
            INSERT INTO notifications (id, recipient_id, type, title, message, link_url)
            VALUES (?, ?, 'order_update', 'New Sale!', ?, ?)
          `,
          ).run(notifId, s.seller_id, message, "/dashboard");

          emitNotification({
            id: notifId,
            recipientId: s.seller_id,
            type: "order_update",
            title: "New Sale!",
            message,
            timestamp,
            read: false,
            linkUrl: `/dashboard`,
          });
        }
      }

      res.redirect(`${getFrontendBaseUrl(req)}/#/order-success?orderId=${tran_id}`);
    } else {
      res.redirect(
        `${getFrontendBaseUrl(req)}/#/checkout?error=Payment validation failed`,
      );
    }
  } catch (err) {
    console.error("[Payment] Error in success route:", err);
    res.redirect(`${getFrontendBaseUrl(req)}/#/checkout?error=Internal server error`);
  }
});

// POST /api/payment/fail
router.post("/fail", (req: Request, res: Response) => {
  const { tran_id } = req.body;
  res.redirect(
    `${getFrontendBaseUrl(req)}/#/checkout?error=Payment failed&tran_id=${tran_id}`,
  );
});

// POST /api/payment/cancel
router.post("/cancel", (req: Request, res: Response) => {
  res.redirect(`${getFrontendBaseUrl(req)}/#/checkout?error=Payment cancelled`);
});

export default router;
