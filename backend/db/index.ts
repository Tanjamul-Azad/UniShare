import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { seedDatabase } from "./seed.js";

const DB_DIR = path.join(process.cwd(), "database");
const DB_PATH = path.join(DB_DIR, "unishare.db");
const SCHEMA_PATH = path.join(process.cwd(), "backend", "db", "schema.sql");

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
db.exec(schema);

// Migrations for columns added after initial schema
const existingCols = (db.prepare("PRAGMA table_info(users)").all() as any[]).map((c: any) => c.name);
if (!existingCols.includes("account_status")) {
  db.exec("ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'");
  console.log("[db] Migration: added account_status column to users");
}

seedDatabase(db);

console.log(`[db] Connected → ${DB_PATH}`);

export default db;
