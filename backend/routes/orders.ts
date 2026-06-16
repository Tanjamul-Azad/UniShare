import { Router, Request, Response } from "express";
import crypto from "crypto";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { emitNotification } from "../socket/index.js";

const router = Router();
console.log("[orders] Router initialized");

const FEE_RATE = 0.05;

// POST /api/orders/ — checkout
router.post("/", requireAuth, (req: Request, res: Response) => {
  try {
    const buyerId = req.user!.id;

    if (req.user?.role === "admin") {
      res.status(403).json({ detail: "Administrators cannot place orders." });
      return;
    }

    if (req.user?.verificationStatus !== "verified") {
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

    if (cartItems.length === 0) {
      res.status(400).json({ detail: "Cart is empty" });
      return;
    }

    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + (item.price ?? 0),
      0,
    );
    const fee = Number((subtotal * FEE_RATE).toFixed(2));
    const total = Number((subtotal + fee).toFixed(2));

    const orderId =
      "UNI-" + crypto.randomUUID().replace(/-/g, "").toUpperCase().slice(0, 8);

    db.prepare(
      `
      INSERT INTO orders (id, buyer_id, total_amount, fee, status)
      VALUES (?, ?, ?, ?, 'paid')
    `,
    ).run(orderId, buyerId, total, fee);

    for (const item of cartItems) {
      db.prepare(
        `
        INSERT INTO order_items (id, order_id, item_id, price_at_purchase)
        VALUES (?, ?, ?, ?)
      `,
      ).run(crypto.randomUUID(), orderId, item.id, item.price ?? 0);
    }

    // Clear the buyer's cart
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(buyerId);

    res
      .status(201)
      .json({ orderId, total, fee, subtotal, itemCount: cartItems.length });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/orders/ — buyer's history
router.get("/", requireAuth, (req: Request, res: Response) => {
  try {
    const buyerId = req.user!.id;
    const orders = db
      .prepare(
        `
      SELECT o.*, COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.buyer_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
      )
      .all(buyerId) as any[];

    const orderItems = db
      .prepare(
        `
      SELECT oi.id,
             oi.order_id AS orderId,
             oi.status,
             oi.seller_note AS sellerNote,
             m.title
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN marketplace_items m ON m.id = oi.item_id
      WHERE o.buyer_id = ?
    `,
      )
      .all(buyerId) as any[];

    const itemsByOrderId = new Map<string, any[]>();
    for (const item of orderItems) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push({
        id: item.id,
        title: item.title,
        status: item.status,
        sellerNote: item.sellerNote,
      });
    }

    res.json(
      orders.map((order) => ({
        id: order.id,
        buyerId: order.buyer_id,
        totalAmount: order.total_amount,
        fee: order.fee,
        status: order.status,
        createdAt: order.created_at,
        items: itemsByOrderId.get(order.id) ?? [],
      })),
    );
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/orders/sales — seller's incoming orders
router.get("/sales", requireAuth, (req: Request, res: Response) => {
  try {
    const sellerId = req.user!.id;
    const sales = db
      .prepare(
        `
      SELECT oi.*, m.title, m.image_url, o.created_at, u.name as buyer_name, u.avatar as buyer_avatar
      FROM order_items oi
      JOIN marketplace_items m ON m.id = oi.item_id
      JOIN orders o ON o.id = oi.order_id
      JOIN users u ON u.id = o.buyer_id
      WHERE m.seller_id = ?
      ORDER BY o.created_at DESC
    `,
      )
      .all(sellerId) as any[];
    res.json(sales);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const order = db
      .prepare(
        `
        SELECT o.*, u.name as buyer_name 
        FROM orders o 
        JOIN users u ON u.id = o.buyer_id 
        WHERE o.id = ? AND (
          o.buyer_id = ?
          OR EXISTS (
            SELECT 1 FROM order_items oi
            JOIN marketplace_items m ON m.id = oi.item_id
            WHERE oi.order_id = o.id AND m.seller_id = ?
          )
        )
      `,
      )
      .get(req.params.id, req.user!.id, req.user!.id) as any;
    if (!order) {
      res.status(404).json({ detail: "Order not found" });
      return;
    }

    const items = db
      .prepare(
        `
      SELECT oi.id, oi.item_id AS itemId, oi.price_at_purchase AS priceAtPurchase, m.title, m.type, m.image_url AS image, m.seller_id AS sellerId
      FROM order_items oi
      LEFT JOIN marketplace_items m ON oi.item_id = m.id
      WHERE oi.order_id = ?
    `,
      )
      .all(req.params.id) as any[];

    res.json({
      id: order.id,
      buyerId: order.buyer_id,
      buyerName: order.buyer_name,
      totalAmount: order.total_amount,
      fee: order.fee,
      status: order.status,
      createdAt: order.created_at,
      items,
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// PATCH /api/orders/items/:id/confirm — seller confirms an item
router.patch(
  "/items/:id/confirm",
  requireAuth,
  (req: Request, res: Response) => {
    try {
      const sellerId = req.user!.id;
      const { id } = req.params;

      // Verify this seller owns the item in this order
      const item = db
        .prepare(
          `
      SELECT oi.*, m.title, o.buyer_id, u.name as seller_name
      FROM order_items oi
      JOIN marketplace_items m ON m.id = oi.item_id
      JOIN orders o ON o.id = oi.order_id
      JOIN users u ON u.id = m.seller_id
      WHERE oi.id = ? AND m.seller_id = ?
    `,
        )
        .get(id, sellerId) as any;

      if (!item) {
        res
          .status(404)
          .json({
            detail: "Order item not found or you don't have permission.",
          });
        return;
      }

      const { note, status } = req.body;
      const newStatus = status || "confirmed";

      db.prepare(
        `
      UPDATE order_items 
      SET status = ?, seller_note = ? 
      WHERE id = ?
    `,
      ).run(newStatus, note || item.seller_note || null, id);

      // Notify Buyer
      const notifId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const statusMsg =
        newStatus === "shipped"
          ? "shipped your order"
          : newStatus === "delivered"
            ? "marked your order as delivered"
            : "confirmed your order";

      const message = `${item.seller_name} has ${statusMsg} for "${item.title}".`;

      const notifTitle =
        newStatus === "shipped"
          ? "Order Shipped!"
          : newStatus === "delivered"
            ? "Order Delivered!"
            : "Order Confirmed!";

      db.prepare(
        `
      INSERT INTO notifications (id, recipient_id, type, title, message, link_url)
      VALUES (?, ?, 'order_update', ?, ?, ?)
    `,
      ).run(notifId, item.buyer_id, notifTitle, message, `/dashboard/orders`);

      emitNotification({
        id: notifId,
        recipientId: item.buyer_id,
        type: "order_update",
        title: notifTitle,
        message,
        timestamp,
        read: false,
        linkUrl: `/dashboard/orders`,
      });

      res.json({ success: true, status: newStatus });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  },
);

export default router;
