import admin from "firebase-admin";

import fs from "fs";
import path from "path";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (serviceAccountJson) {
  try {
    let serviceAccount;
    
    // Check if it's a path or a JSON string
    if (serviceAccountJson.endsWith(".json") && fs.existsSync(path.resolve(process.cwd(), serviceAccountJson))) {
      const fileContent = fs.readFileSync(path.resolve(process.cwd(), serviceAccountJson), "utf8");
      serviceAccount = JSON.parse(fileContent);
    } else {
      serviceAccount = JSON.parse(serviceAccountJson);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
} else {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin not initialized. Social login verification will fail.");
  }
}

export default admin;
