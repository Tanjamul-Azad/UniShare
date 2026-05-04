import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'unishare.db');
const db = new Database(dbPath);

const user = db.prepare("SELECT id FROM users WHERE name LIKE '%tanzamul%'").get() as { id: string };
if (user) {
  console.log('User ID:', user.id);
  const buyerId = user.id;
  
  try {
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

    console.log('Orders found:', orders.length);
    console.log('Order items found:', orderItems.length);
  } catch (err: any) {
    console.error('SQL Error:', err.message);
  }
} else {
  console.log('User not found');
}

db.close();
