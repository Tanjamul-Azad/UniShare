
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "database", "unishare.db");
const db = new Database(DB_PATH);

try {
  const users = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  const listings = db.prepare("SELECT COUNT(*) as count FROM marketplace_items").get() as any;
  const verifications = db.prepare("SELECT COUNT(*) as count FROM verification_requests").get() as any;

  console.log("User Count:", users.count);
  console.log("Listing Count:", listings.count);
  console.log("Verification Request Count:", verifications.count);

  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin'").get() as any;
  console.log("Admin User:", admin ? admin.email : "Not Found");

} catch (error) {
  console.error("Error checking DB:", error);
} finally {
  db.close();
}
