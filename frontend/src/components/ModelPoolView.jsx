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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#faf8f5]">
      {/* Header Section */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[11px] font-mono mb-2 font-medium">
            <Layers size={11} className="text-orange-600" />
            <span>Autonomous Routing Infrastructure</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Model Pool Infrastructure
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Cortex automatically selects the most suitable available model based on task requirements, capability, availability, and efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProviders}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs transition-all cursor-pointer"
            title="Refresh Provider Pool"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-600" : ""} />
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl border-none shadow-xs shadow-orange-600/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Connect Provider Key</span>
          </button>
        </div>
      </div>

      {/* Autonomous Selection Policy Note */}
      <div className="my-6 p-4.5 rounded-2xl bg-orange-50/50 border border-orange-200/80 shadow-2xs flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200/80 flex items-center justify-center text-orange-600 shrink-0 mt-0.5 shadow-2xs">
          <Info size={16} />
        </div>
        <div className="text-xs text-stone-700 space-y-1">
          <div className="font-bold text-stone-900">
            Provider-Independent Execution & Zero Manual Switching
          </div>
          <p className="text-stone-600 leading-relaxed">
            You do not need to choose a model for every prompt. When a query is submitted, Cortex evaluates complexity, retrieval needs, reasoning depth, and latency constraints to route subtasks dynamically across your active model pool.
          </p>
        </div>
      </div>

      {/* Compact Professional Table */}
      <div className="border border-stone-200 rounded-2xl bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[10.5px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                <th className="py-3.5 px-4 sm:px-5">Model / Provider</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4">Capabilities</th>
                <th className="py-3.5 px-3">Availability</th>
                <th className="py-3.5 px-3">Efficiency</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Loader2 size={20} className="animate-spin text-orange-600 mx-auto mb-2" />
                    <span>Synchronizing provider pool...</span>
                  </td>
                </tr>
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No providers configured yet.
                  </td>
                </tr>
              ) : (
                providers.map((p) => {
                  const isConnected = p.status === "connected";
                  return (
                    <tr
                      key={p.provider}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* Provider / Model */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-700 font-mono text-xs font-bold shrink-0 shadow-2xs">
                            {p.name?.slice(0, 2).toUpperCase() || "AI"}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{p.name || p.provider}</span>
                              {isConnected && (
                                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200">
                                  BYOK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              {p.models?.[0] || p.provider}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium ${
                            isConnected
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-stone-100 text-stone-600 border border-stone-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-stone-400"
                            }`}
                          />
                          {isConnected ? "Available (BYOK)" : "Fallback Active"}
                        </span>
                      </td>

                      {/* Capabilities */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11.5px] text-stone-700 font-medium">
                          {p.capabilities?.join(" · ") || "Inference & Reasoning"}
                        </div>
                      </td>

                      {/* Availability */}
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-mono font-semibold text-emerald-700">
                          {p.availability || "High (99.9%)"}
                        </span>
                      </td>

                      {/* Efficiency */}
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] font-mono font-semibold text-orange-600">
                          {p.efficiency || "High"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setShowConnectModal(true)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-stone-700 hover:text-orange-700 bg-white hover:bg-stone-50 rounded-lg border border-stone-200 shadow-2xs transition-all cursor-pointer"
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
      <div className="mt-6 p-4 rounded-xl border border-stone-200 bg-white shadow-2xs flex items-center justify-between flex-wrap gap-3 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>All BYOK provider keys are protected via AES-256-GCM hardware encryption.</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500">
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
