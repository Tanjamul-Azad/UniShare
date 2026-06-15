import admin from "firebase-admin";

import fs from "fs";
import path from "path";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

const resolveServiceAccountPath = (value: string) => {
  if (path.isAbsolute(value) && fs.existsSync(value)) {
    return value;
  }

  const candidates = [
    path.resolve(process.cwd(), value),
    path.resolve(process.cwd(), "..", value),
    path.resolve(process.cwd(), "..", "..", value),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

if (serviceAccountJson) {
  try {
    let serviceAccount;
    
    // Check if it's a path or a JSON string
    if (serviceAccountJson.endsWith(".json")) {
      const resolvedPath = resolveServiceAccountPath(serviceAccountJson);
      if (!resolvedPath) {
        throw new Error(
          `FIREBASE_SERVICE_ACCOUNT_JSON path not found: ${serviceAccountJson}`,
        );
      }

      const fileContent = fs.readFileSync(resolvedPath, "utf8");
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
