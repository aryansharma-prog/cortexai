import { cert, initializeApp, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount = null;

// 1. Try environment variable FIREBASE_SERVICE_ACCOUNT (JSON string or Base64)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (raw.startsWith("{")) {
      serviceAccount = JSON.parse(raw);
    } else {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      serviceAccount = JSON.parse(decoded);
    }
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", err.message);
  }
}

// 2. Try individual environment variables
if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || "cotex-ai-4f3b2",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

// 3. Try local serviceAccountKey.json file if present
if (!serviceAccount) {
  const localKeyPath = path.resolve(__dirname, "../serviceAccountKey.json");
  if (fs.existsSync(localKeyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));
    } catch (err) {
      console.error("Failed to read local serviceAccountKey.json:", err.message);
    }
  }
}

export const app = getApps().length
  ? getApps()[0]
  : initializeApp(
      serviceAccount
        ? { credential: cert(serviceAccount) }
        : { projectId: process.env.FIREBASE_PROJECT_ID || "cotex-ai-4f3b2" }
    );