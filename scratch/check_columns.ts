import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'unishare.db');
const db = new Database(dbPath);

const info = db.prepare('PRAGMA table_info(order_items)').all();
console.log('Columns in order_items:', JSON.stringify(info, null, 2));

db.close();
