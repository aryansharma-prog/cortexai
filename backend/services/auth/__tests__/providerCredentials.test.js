import { encryptKey, decryptKey, maskKey } from "../utils/crypto.js";
import { validateProviderApiKey } from "../utils/providerValidator.js";

console.log("==================================================");
console.log("🧪 Running CortexAI Phase 1: Secure Model Configuration & BYOK Test Suite");
console.log("==================================================");

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// --- TEST 1: AES-256-GCM Encryption Integrity ---
console.log("\n--- TEST 1: AES-256-GCM Encryption & Decryption ---");
const sampleRawKey = "sk-proj-99887766554433221100AABBCCDDEEFF7A92";
const encryptedPayload = encryptKey(sampleRawKey);

assert(Boolean(encryptedPayload), "encryptKey returns payload");
assert(Boolean(encryptedPayload?.iv), "Payload contains initialization vector (iv)");
assert(Boolean(encryptedPayload?.encryptedData), "Payload contains ciphertext (encryptedData)");
assert(Boolean(encryptedPayload?.authTag), "Payload contains authentication tag (authTag)");
assert(encryptedPayload.encryptedData !== sampleRawKey, "Ciphertext must not match raw plaintext key");
assert(!encryptedPayload.encryptedData.includes(sampleRawKey), "Ciphertext must not contain raw plaintext key");

const decrypted = decryptKey(encryptedPayload);
assert(decrypted === sampleRawKey, "Decrypted key matches exact original plaintext");

// --- TEST 2: Cryptographic Tampering & AuthTag Verification ---
console.log("\n--- TEST 2: Cryptographic Tampering & Authentication Tag ---");
const tamperedPayload = {
  ...encryptedPayload,
  encryptedData: encryptedPayload.encryptedData.slice(0, -2) + "00"
};
const tamperedResult = decryptKey(tamperedPayload);
assert(tamperedResult === null, "Decryption of tampered ciphertext fails and returns null (AES-GCM AuthTag check)");

const tamperedTagPayload = {
  ...encryptedPayload,
  authTag: "00112233445566778899aabbccddeeff"
};
const tamperedTagResult = decryptKey(tamperedTagPayload);
assert(tamperedTagResult === null, "Decryption with forged authTag fails and returns null");

// --- TEST 3: Safe Masking Identifiers ---
console.log("\n--- TEST 3: Safe Masking Identifiers ---");
const geminiMask = maskKey("AIzaSyB1234567890ABCDEF7A92");
assert(geminiMask.endsWith("7A92"), `Gemini mask ends with last 4 characters: ${geminiMask}`);
assert(!geminiMask.includes("AIzaSyB12345"), "Gemini mask must never reveal secret key body");
assert(geminiMask.includes("••••••••"), "Gemini mask contains bullet points");

const openaiMask = maskKey("sk-proj-1234567890ABCDEF2F91");
assert(openaiMask.startsWith("sk-"), "OpenAI mask preserves sk- prefix for provider recognition");
assert(openaiMask.endsWith("2F91"), `OpenAI mask ends with last 4 characters: ${openaiMask}`);
assert(!openaiMask.includes("1234567890"), "OpenAI mask never leaks secret payload");

const shortMask = maskKey("123");
assert(shortMask === "••••••••", "Short invalid key safely defaults to mask");

// --- TEST 4: Format & Provider Validation ---
console.log("\n--- TEST 4: Provider Key Validation Checks ---");
async function runValidationTests() {
  const shortKeyResult = await validateProviderApiKey("gemini", "short");
  assert(shortKeyResult.valid === false, "Keys shorter than 8 chars are immediately rejected");
  assert(shortKeyResult.message.includes("too short") || shortKeyResult.message.includes("invalid"), "Safe error message returned without exposing key");

  const groqFormatResult = await validateProviderApiKey("groq", "gsk_test_mock_format_key_1234567890");
  assert(typeof groqFormatResult.valid === "boolean", "Validation result returns valid boolean property");

  console.log("\n==================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS COMPLETED!`);
  console.log("==================================================");
}

runValidationTests();
