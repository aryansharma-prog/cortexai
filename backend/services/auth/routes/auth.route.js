import express from "express";
import {
  deductCredits,
  login,
  logOut,
  updateUserPayment,
  getProviders,
  connectProviderKey,
  disconnectProviderKey,
  completeOnboarding,
  getUserProfile
} from "../controllers/auth.controller.js";

const router = express.Router();

// Authentication
router.post("/login", login);
router.get("/logout", logOut);
router.post("/logout", logOut);

// Credits & Billing
router.post("/update-plan", updateUserPayment);
router.post("/deduct-credits", deductCredits);

// BYOK Model Provider Key Management (AES-256-GCM Encrypted)
router.get("/providers", getProviders);
router.post("/providers/connect", connectProviderKey);
router.delete("/providers/:provider", disconnectProviderKey);

// Onboarding Status
router.post("/onboarding/complete", completeOnboarding);

// Extended Profile
router.get("/profile", getUserProfile);

export default router;