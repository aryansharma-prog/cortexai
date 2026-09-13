import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ShieldCheck,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Edit3
} from "lucide-react";
import {
  getProviders,
  connectProvider,
  disconnectProvider,
  validateProvider,
  completeOnboarding
} from "../features/providerApi";

export default function OnboardingModal({ open, onClose, onCompleted }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProviderInput, setActiveProviderInput] = useState(null);
  const [activeManageProvider, setActiveManageProvider] = useState(null);
  const [inputKey, setInputKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchProviderData = async () => {
    setLoading(true);
    const data = await getProviders();
    setProviders(data?.providers || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchProviderData();
    }
  }, [open]);

  const handleConnect = async (providerId) => {
    if (!inputKey.trim()) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await connectProvider(providerId, inputKey);
      setStatusMessage({
        type: "success",
        text: `✓ ${providerId.toUpperCase()} connected and validated successfully.`
      });
      setInputKey("");
      setActiveProviderInput(null);
      setActiveManageProvider(null);
      await fetchProviderData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to validate and connect API key."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (providerId) => {
    setValidating((prev) => ({ ...prev, [providerId]: true }));
    setStatusMessage(null);
    try {
      const res = await validateProvider(providerId);
      setStatusMessage({
        type: res.success ? "success" : "error",
        text: res.message || `${providerId} validated.`
      });
      await fetchProviderData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || `Validation failed for ${providerId}.`
      });
    } finally {
      setValidating((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleDisconnect = async (providerId) => {
    setSaving(true);
    try {
      await disconnectProvider(providerId);
      setStatusMessage({ type: "info", text: `${providerId} disconnected.` });
      setActiveManageProvider(null);
      await fetchProviderData();
    } catch (err) {
      setStatusMessage({ type: "error", text: "Failed to disconnect." });
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    if (onCompleted) onCompleted();
    if (onClose) onClose();
  };

  const connectedCount = providers.filter((p) => p.status === "connected").length;

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-[680px] bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-stone-200 flex items-start justify-between gap-4 bg-stone-50/50">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[11px] font-mono mb-2 font-medium">
                <Sparkles size={11} className="text-orange-600" />
                <span>BYOK Secure Credential Onboarding</span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                Connect Your AI Models
              </h2>
              <p className="text-xs sm:text-[13px] text-stone-500 mt-1 leading-relaxed">
                Connect your own AI providers to power CortexAI. Your credentials are securely encrypted and remain under your control.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : statusMessage.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-orange-50 border-orange-200 text-orange-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === "success" ? (
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={14} className="shrink-0" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-stone-400 hover:text-stone-600 border-none bg-transparent cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Providers List / Table */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
                <Loader2 size={20} className="animate-spin text-orange-600" />
                <span>Loading model providers...</span>
              </div>
            ) : (
              providers.map((p) => {
                const isConnected = p.status === "connected";
                const isEditing = activeProviderInput === p.provider;
                const isManaging = activeManageProvider === p.provider;
                const isValidating = validating[p.provider];

                return (
                  <div
                    key={p.provider}
                    className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/70 hover:bg-stone-50 transition-colors flex flex-col gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isConnected
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              : "bg-stone-300"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-800">
                              {p.name || p.provider}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500 px-1.5 py-0.5 rounded bg-white border border-stone-200">
                              {p.models?.[0] || p.provider}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {p.capabilities?.join(" · ") || "Inference & Reasoning"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-stone-600 bg-white px-2 py-1 rounded border border-stone-200">
                              {p.keyMask || "••••••••••••"}
                            </span>
                            <button
                              onClick={() => {
                                setActiveManageProvider(isManaging ? null : p.provider);
                                setActiveProviderInput(null);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 rounded-lg border border-stone-200 shadow-2xs transition-all cursor-pointer"
                            >
                              {isManaging ? "Close" : "Manage"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveProviderInput(isEditing ? null : p.provider);
                              setActiveManageProvider(null);
                              setInputKey("");
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-orange-700 hover:text-white bg-orange-50 hover:bg-orange-600 rounded-lg border border-orange-200 transition-all cursor-pointer shadow-2xs"
                          >
                            {isEditing ? "Cancel" : "Connect"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Manage Sub-Menu for Connected Providers */}
                    {isManaging && isConnected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2.5 border-t border-stone-200/80 flex items-center justify-between flex-wrap gap-2 text-xs"
                      >
                        <div className="text-[11px] text-stone-600 flex items-center gap-2 font-medium">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Status: Connected & AES-256-GCM Encrypted</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleValidate(p.provider)}
                            disabled={isValidating}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 shadow-2xs transition-all cursor-pointer font-medium"
                          >
                            <RefreshCw
                              size={11}
                              className={isValidating ? "animate-spin text-orange-600" : "text-orange-600"}
                            />
                            <span>{isValidating ? "Testing..." : "Validate"}</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveProviderInput(p.provider);
                              setActiveManageProvider(null);
                              setInputKey("");
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 shadow-2xs transition-all cursor-pointer font-medium"
                          >
                            <Edit3 size={11} className="text-orange-600" />
                            <span>Replace Key</span>
                          </button>

                          <button
                            onClick={() => handleDisconnect(p.provider)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer font-medium"
                          >
                            <Trash2 size={11} />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Inline Key Input Form (Connect or Replace) */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t border-stone-200/80 flex flex-col gap-2"
                      >
                        <div className="text-[11px] text-stone-600 font-medium">
                          Enter your {p.name} API Key (will be validated live and encrypted):
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showKeyText ? "text" : "password"}
                              value={inputKey}
                              onChange={(e) => setInputKey(e.target.value)}
                              placeholder={`Paste ${p.name} API Key (e.g. sk-...)`}
                              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 font-mono pr-8 shadow-2xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleConnect(p.provider);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowKeyText(!showKeyText)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 border-none bg-transparent cursor-pointer p-0"
                            >
                              {showKeyText ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                          <button
                            onClick={() => handleConnect(p.provider)}
                            disabled={saving || !inputKey.trim()}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg border-none cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0 shadow-xs shadow-orange-600/20"
                          >
                            {saving ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Validating & Saving...</span>
                              </>
                            ) : (
                              <span>Save & Connect</span>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Security Transparency Box */}
          <div className="mx-6 my-2 p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/80 flex flex-col gap-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-800">
              <ShieldCheck size={14} className="text-orange-600" />
              <span>Enterprise-Grade Encryption & Zero Plaintext Exposure</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Your API keys are encrypted with <strong>AES-256-GCM</strong> before storage and are never displayed again in plain text.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[10.5px] text-stone-600 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Encrypted storage (AES-256-GCM)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Keys never exposed in the UI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Used solely for authorized model tasks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Provider credentials user-controlled</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between flex-wrap gap-3">
            <div className="text-[11.5px] text-stone-500 font-medium">
              {connectedCount > 0 ? (
                <span className="text-emerald-700 font-semibold">
                  {connectedCount} model{connectedCount > 1 ? "s" : ""} connected
                </span>
              ) : (
                <span>System fallback models active</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleFinish}
                className="px-3.5 py-1.5 text-xs text-stone-500 hover:text-stone-800 bg-transparent hover:bg-stone-100 rounded-xl border border-transparent transition-colors cursor-pointer font-medium"
              >
                Skip for now
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl border-none shadow-xs shadow-orange-600/20 transition-all cursor-pointer"
              >
                <span>Continue to Command Center</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
