import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'unishare.db');
const db = new Database(dbPath);

const orders = db.prepare('SELECT * FROM orders').all();
const orderItems = db.prepare('SELECT * FROM order_items').all();

console.log('Orders:', JSON.stringify(orders, null, 2));
console.log('Order Items:', JSON.stringify(orderItems, null, 2));

db.close();
