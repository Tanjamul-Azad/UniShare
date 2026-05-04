
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

// Load JWT_SECRET from .env
const env = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
const secretMatch = env.match(/JWT_SECRET=(.*)/);
const JWT_SECRET = secretMatch ? secretMatch[1].trim() : "unishare-dev-secret-change-in-prod";

const payload = {
  id: "0591071c-1c16-4368-921e-c767063b3aa9", // The new admin ID
  name: "Admin",
  email: "i.m.tanjamul@gmail.com",
  role: "admin",
  verificationStatus: "verified"
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
console.log(token);
