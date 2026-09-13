import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
// Derive a stable 32-byte key from the secret
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "cortex_ai_master_key_secret_2026_production_safe_32_bytes";

function getKey() {
  return crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
}

/**
 * Encrypts sensitive API key using AES-256-GCM.
 * Never stores or returns plain text keys.
 * @param {string} plainText 
 * @returns {{ iv: string, encryptedData: string, authTag: string } | null}
 */
export function encryptKey(plainText) {
  if (!plainText || typeof plainText !== "string") return null;
  const trimmed = plainText.trim();
  if (!trimmed) return null;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(trimmed, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
    authTag
  };
}

/**
 * Decrypts encrypted API key securely for internal model invocation.
 * @param {{ iv: string, encryptedData: string, authTag: string }} encryptedPayload 
 * @returns {string | null}
 */
export function decryptKey(encryptedPayload) {
  if (!encryptedPayload || !encryptedPayload.encryptedData || !encryptedPayload.iv || !encryptedPayload.authTag) {
    return null;
  }
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(encryptedPayload.iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(encryptedPayload.authTag, "hex"));
    let decrypted = decipher.update(encryptedPayload.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[CRYPTO ERROR] Failed to decrypt credentials securely:", err.message);
    return null;
  }
}

/**
 * Masks API credentials to never expose full key in UI or logs.
 * Example: "••••••••••••••7A92" or "sk-••••••••3F12"
 * @param {string} plainText 
 * @returns {string}
 */
export function maskKey(plainText) {
  if (!plainText || typeof plainText !== "string") return "••••••••••••";
  const trimmed = plainText.trim();
  if (trimmed.length <= 4) return "••••••••";
  const lastFour = trimmed.slice(-4).toUpperCase();
  const prefix = trimmed.startsWith("sk-") ? "sk-••••••••" : "••••••••••••";
  return `${prefix}${lastFour}`;
}
