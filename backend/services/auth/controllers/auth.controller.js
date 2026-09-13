import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";
import { encryptKey, maskKey } from "../utils/crypto.js";
import crypto from "crypto";

const DEFAULT_SUPPORTED_PROVIDERS = [
  {
    provider: "gemini",
    name: "Google Gemini",
    models: ["gemini-2.5-pro", "gemini-3.6-flash"],
    capabilities: ["Reasoning", "Vision", "Long Context"],
    latency: "Fast",
    efficiency: "High",
    supported: true
  },
  {
    provider: "claude",
    name: "Anthropic Claude",
    models: ["claude-3-7-sonnet", "claude-3-5-haiku"],
    capabilities: ["Reasoning", "Architecture", "Deep Coding"],
    latency: "Standard",
    efficiency: "High",
    supported: true
  },
  {
    provider: "groq",
    name: "Groq LPU",
    models: ["llama-3.3-70b", "openai/gpt-oss-120b"],
    capabilities: ["Fast Inference", "Low Latency Reasoning", "Coding"],
    latency: "Ultra-Fast",
    efficiency: "Maximum",
    supported: true
  },
  {
    provider: "deepseek",
    name: "DeepSeek",
    models: ["deepseek-r1", "deepseek-v3"],
    capabilities: ["Mathematical Reasoning", "Deep Coding"],
    latency: "Fast",
    efficiency: "High",
    supported: true
  },
  {
    provider: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini"],
    capabilities: ["Reasoning", "Coding", "Function Calling"],
    latency: "Standard",
    efficiency: "High",
    supported: true
  },
  {
    provider: "openrouter",
    name: "OpenRouter",
    models: ["multi-provider router", "100+ open-source models"],
    capabilities: ["Dynamic Failover", "Multi-Model Fallback"],
    latency: "Fast",
    efficiency: "High",
    supported: true
  }
];

async function resolveUser(req) {
  const userId = req.headers["x-user-id"] || req.body?.userId || req.query?.userId;
  if (userId && userId !== "anonymous" && userId !== "undefined") {
    try {
      const user = await User.findById(userId);
      if (user) return user;
    } catch (e) {}
  }
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const sessionId = req.cookies?.session || req.headers["x-session-id"] || req.body?.sessionId || bearerToken;
  if (sessionId) {
    try {
      const sessionStr = await redis.get(`session-${sessionId}`);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.userId || session._id) {
          const user = await User.findById(session.userId || session._id);
          if (user) return user;
        }
      }
    } catch (e) {}
  }
  return null;
}

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Firebase auth token is required" });
    }

    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({
      firebaseUid: decoded.uid
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || decoded.email?.split("@")[0] || "User",
        email: decoded.email,
        avatar: decoded.picture || "",
        hasCompletedOnboarding: false
      });
    }

    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan || "free",
      credits: user.credits ?? 100,
      totalCredits: user.totalCredits ?? 100,
      planExpiresAt: user.planExpiresAt,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false
    };

    await redis.set(`user-session-${user._id}`, sessionId, "EX", 7 * 24 * 60 * 60);
    await redis.set(`session-${sessionId}`, JSON.stringify(sessionData), "EX", 7 * 24 * 60 * 60);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userObj = user.toObject ? user.toObject() : JSON.parse(JSON.stringify(user));
    // Never expose encrypted keys in session or user payload
    delete userObj.connectedProviders;

    return res.status(200).json({
      ...userObj,
      sessionId,
      isNewUser
    });
  } catch (error) {
    console.error("[Login Error]", error);
    return res.status(500).json({ message: `Login failed: ${error.message || error}` });
  }
};

export const logOut = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const sessionId = req.cookies?.session || req.headers["x-session-id"] || req.body?.sessionId || bearerToken;
    if (sessionId) {
      await redis.del(`session-${sessionId}`);
    }

    res.clearCookie("session", {
      path: "/",
      sameSite: "none",
      secure: true
    });
    return res.status(200).json({ message: "logout successfully" });
  } catch (error) {
    return res.status(500).json({ message: `logout error ${error}` });
  }
};

/**
 * Get all available providers and user connection status (masked keys only)
 * GET /api/auth/providers
 */
export const getProviders = async (req, res) => {
  try {
    const user = await resolveUser(req);
    const userProviders = user?.connectedProviders || [];

    const providerList = DEFAULT_SUPPORTED_PROVIDERS.map(p => {
      const userEntry = userProviders.find(u => u.provider === p.provider);
      const isConnected = userEntry?.status === "connected";
      return {
        ...p,
        status: isConnected ? "connected" : "not_connected",
        keyMask: isConnected ? (userEntry.keyMask || "••••••••••••") : null,
        connectedAt: isConnected ? userEntry.connectedAt : null,
        isUserProvided: isConnected
      };
    });

    return res.status(200).json({
      providers: providerList,
      hasCompletedOnboarding: user?.hasCompletedOnboarding ?? false,
      securityInfo: {
        encryption: "AES-256-GCM",
        keysStoredSecurely: true,
        zeroPlainTextExposure: true
      }
    });
  } catch (error) {
    console.error("[Get Providers Error]", error);
    return res.status(500).json({ message: "Failed to fetch providers" });
  }
};

/**
 * Connect a user API key securely with AES-256-GCM encryption
 * POST /api/auth/providers/connect
 */
export const connectProviderKey = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    if (!provider || !apiKey || typeof apiKey !== "string" || apiKey.trim().length < 8) {
      return res.status(400).json({ message: "A valid provider and API key are required." });
    }

    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized. Please log in first." });
    }

    // Encrypt key with AES-256-GCM
    const encryptedKey = encryptKey(apiKey.trim());
    const keyMask = maskKey(apiKey.trim());

    if (!user.connectedProviders) {
      user.connectedProviders = [];
    }

    const existingIdx = user.connectedProviders.findIndex(p => p.provider === provider.toLowerCase());
    const entryData = {
      provider: provider.toLowerCase(),
      status: "connected",
      keyMask,
      encryptedKey,
      connectedAt: existingIdx >= 0 ? user.connectedProviders[existingIdx].connectedAt : new Date(),
      updatedAt: new Date()
    };

    if (existingIdx >= 0) {
      user.connectedProviders[existingIdx] = entryData;
    } else {
      user.connectedProviders.push(entryData);
    }

    await user.save();

    console.log(`[AUTH] Securely saved encrypted API key for provider="${provider}" userId="${user._id}"`);

    return res.status(200).json({
      success: true,
      provider: provider.toLowerCase(),
      status: "connected",
      keyMask,
      message: `${provider} connected securely.`
    });
  } catch (error) {
    console.error("[Connect Provider Key Error]", error);
    return res.status(500).json({ message: `Failed to save provider key: ${error.message}` });
  }
};

/**
 * Disconnect a provider API key
 * DELETE /api/auth/providers/:provider
 */
export const disconnectProviderKey = async (req, res) => {
  try {
    const provider = req.params.provider?.toLowerCase();
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.connectedProviders) {
      user.connectedProviders = user.connectedProviders.filter(p => p.provider !== provider);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      provider,
      status: "not_connected",
      message: `${provider} disconnected.`
    });
  } catch (error) {
    console.error("[Disconnect Provider Error]", error);
    return res.status(500).json({ message: "Failed to disconnect provider" });
  }
};

/**
 * Mark onboarding as completed
 * POST /api/auth/onboarding/complete
 */
export const completeOnboarding = async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    user.hasCompletedOnboarding = true;
    await user.save();

    // Update Redis session
    const sessionId = await redis.get(`user-session-${user._id}`);
    if (sessionId) {
      const sessionStr = await redis.get(`session-${sessionId}`);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.hasCompletedOnboarding = true;
        await redis.set(`session-${sessionId}`, JSON.stringify(session), "EX", 7 * 24 * 60 * 60);
      }
    }

    return res.status(200).json({ success: true, hasCompletedOnboarding: true });
  } catch (error) {
    console.error("[Complete Onboarding Error]", error);
    return res.status(500).json({ message: "Failed to complete onboarding" });
  }
};

/**
 * Get comprehensive user profile stats
 * GET /api/auth/profile
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const connectedCount = (user.connectedProviders || []).filter(p => p.status === "connected").length;

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan || "free",
        credits: user.credits,
        totalCredits: user.totalCredits,
        hasCompletedOnboarding: user.hasCompletedOnboarding || false,
        createdAt: user.createdAt
      },
      connectedModelsCount: connectedCount,
      security: {
        encryption: "AES-256-GCM Active",
        keysStoredSecurely: true,
        zeroPlainTextExposure: true,
        sessionActive: true
      },
      preferences: user.preferences || {
        routingStrategy: "auto",
        compressionLevel: "adaptive"
      }
    });
  } catch (error) {
    console.error("[Get User Profile Error]", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.plan = plan;
    user.credits += credits;
    user.totalCredits += credits;
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    const sessionId = await redis.get(`user-session-${user._id}`);
    if (sessionId) {
      await redis.set(`session-${sessionId}`, JSON.stringify({
        userId: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt
      }), "EX", 7 * 24 * 60 * 60);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: `update user payment error ${error}` });
  }
};

export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body;
    const COST = {
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      vision: 10
    };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    const requiredCredits = COST[agent] || 1;
    if (user.credits < requiredCredits) {
      return res.status(400).json({ message: "Not enough credits." });
    }
    user.credits -= requiredCredits;
    await user.save();

    const sessionId = await redis.get(`user-session-${user._id}`);
    if (sessionId) {
      await redis.set(`session-${sessionId}`, JSON.stringify({
        userId: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt
      }), "EX", 7 * 24 * 60 * 60);
    }

    return res.status(200).json({ success: true, credits: user.credits });
  } catch (error) {
    return res.status(500).json({ message: `deduct credits error ${error}` });
  }
};