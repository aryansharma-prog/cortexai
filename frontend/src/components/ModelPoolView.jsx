import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  Sliders,
  Cpu,
  Trash2,
  Zap,
  Info,
  Loader2
} from "lucide-react";
import {
  getProviders,
  connectProvider,
  disconnectProvider
} from "../features/providerApi";
import OnboardingModal from "./OnboardingModal";

export default function ModelPoolView() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProviderToManage, setSelectedProviderToManage] = useState(null);

  const loadProviders = async () => {
    setLoading(true);
    const data = await getProviders();
    setProviders(data?.providers || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProviders();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Header Section */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono mb-2">
            <Layers size={11} />
            <span>Autonomous Routing Infrastructure</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-100 tracking-tight">
            MODEL POOL
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Cortex automatically selects the most suitable available model based on task requirements, capability, availability and efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProviders}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors cursor-pointer"
            title="Refresh Provider Pool"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : ""} />
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl border-none shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Connect Provider Key</span>
          </button>
        </div>
      </div>

      {/* Autonomous Selection Policy Note */}
      <div className="my-6 p-4 rounded-xl bg-[#0e121a] border border-blue-500/20 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
          <Info size={14} />
        </div>
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200">
            Provider-Independent Execution & Zero Manual Switching
          </div>
          <p className="text-slate-400 leading-relaxed">
            You do not need to choose a model for every prompt. When a query is submitted, Cortex evaluates complexity, retrieval needs, reasoning depth, and latency constraints to route subtasks dynamically across your active model pool.
          </p>
        </div>
      </div>

      {/* Compact Professional Table */}
      <div className="border border-white/[0.08] rounded-2xl bg-[#0b0d13] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 sm:px-5">Model / Provider</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Capabilities</th>
                <th className="py-3 px-3">Availability</th>
                <th className="py-3 px-3">Efficiency</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 size={18} className="animate-spin text-blue-400 mx-auto mb-2" />
                    <span>Synchronizing provider pool...</span>
                  </td>
                </tr>
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No providers configured yet.
                  </td>
                </tr>
              ) : (
                providers.map((p) => {
                  const isConnected = p.status === "connected";
                  return (
                    <tr
                      key={p.provider}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Provider / Model */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-300 font-mono text-[11px] font-bold shrink-0">
                            {p.name?.slice(0, 2).toUpperCase() || "AI"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              <span>{p.name || p.provider}</span>
                              {isConnected && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  BYOK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {p.models?.[0] || p.provider}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium ${
                            isConnected
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-slate-500"
                            }`}
                          />
                          {isConnected ? "Available (BYOK)" : "Fallback Active"}
                        </span>
                      </td>

                      {/* Capabilities */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11.5px] text-slate-300 font-medium">
                          {p.capabilities?.join(" · ") || "Inference & Reasoning"}
                        </div>
                      </td>

                      {/* Availability */}
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-mono text-emerald-400">
                          {p.availability || "High (99.9%)"}
                        </span>
                      </td>

                      {/* Efficiency */}
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-mono text-blue-400">
                          {p.efficiency || "High"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setShowConnectModal(true)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.08] transition-all cursor-pointer"
                        >
                          {isConnected ? "Manage" : "Connect Key"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Transparency Footer */}
      <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex items-center justify-between flex-wrap gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>All BYOK provider keys are protected via AES-256-GCM hardware encryption.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
          <span>Zero Plaintext Exposure</span>
          <span>•</span>
          <span>Shared Notebook Synchronized</span>
        </div>
      </div>

      {/* Manage / Connect Modal */}
      <OnboardingModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onCompleted={() => {
          loadProviders();
          setShowConnectModal(false);
        }}
      />
    </div>
  );
}
