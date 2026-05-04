
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "database", "unishare.db");
const db = new Database(DB_PATH);

const targetEmail = "i.m.tanjamul@gmail.com";
const newName = "Admin";
const newPassword = "Admin1234";
const passwordHash = bcrypt.hashSync(newPassword, 10);

try {
  // 1. Delete the legacy u-admin if it's not our target
  db.prepare("DELETE FROM users WHERE id = 'u-admin' AND email != ?").run(targetEmail);

  // 2. Update the target user to be admin
  const result = db.prepare("UPDATE users SET role = 'admin', name = ?, password_hash = ? WHERE email = ?").run(newName, passwordHash, targetEmail);
  
  if (result.changes > 0) {
    console.log(`User ${targetEmail} upgraded to admin successfully.`);
  } else {
    // 3. If target user didn't exist, create it as u-admin
    console.log(`${targetEmail} not found. Creating new u-admin...`);
    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, verification_status, joined_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("u-admin", newName, targetEmail, passwordHash, "admin", "verified", "January 2024");
    console.log("Admin user created.");
  }
} catch (error) {
  console.error("Error updating admin user:", error);
} finally {
  db.close();
}
