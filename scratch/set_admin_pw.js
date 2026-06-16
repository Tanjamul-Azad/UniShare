import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hash = bcrypt.hashSync('admin123', 10);
const dbs = ['database/unishare.db', 'unishare.db'];

dbs.forEach(function(dbPath) {
  try {
    const db = new Database(path.join(__dirname, '..', dbPath));
    const r = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hash, 'i.m.tanjamul@gmail.com');
    console.log(dbPath + ': ' + r.changes + ' row(s) updated');
    db.close();
  } catch (e) {
    console.log(dbPath + ': ' + e.message);
  }
});
