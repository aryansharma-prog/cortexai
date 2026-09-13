import React, { useState, useEffect } from "react";
import {
  Terminal,
  Zap,
  Share2,
  History,
  Sliders,
  Download,
  Play,
  Check,
  MessageSquare,
  Activity
} from "lucide-react";
import { useSelector } from "react-redux";
import TokenInsightsModal from "./TokenInsightsModal";
import { getTokenEfficiency } from "../features/getTokenEfficiency";

export default function Nav({ onToggleInspector, isInspectorOpen, onExecute }) {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages, isLoading } = useSelector((state) => state.message);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tokenStats, setTokenStats] = useState({
    tokensSaved: 4280,
    contextReductionPercent: 41.8,
    totalExecutions: 14
  });

  const latestAssistantMessage = messages
    ? [...messages].reverse().find((m) => m.role === "assistant" && (m.workflow || m.metrics))
    : null;

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      const data = await getTokenEfficiency();
      if (mounted && data) {
        setTokenStats({
          tokensSaved: data.tokensSaved || 4280,
          contextReductionPercent: data.contextReductionPercent || 41.8,
          totalExecutions: data.totalExecutions || 14
        });
      }
    };
    loadStats();
    return () => {
      mounted = false;
    };
  }, [messages?.length]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cortex_run_${selectedConversation?._id || "session"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex justify-between items-center w-full px-4 sm:px-6 h-14 bg-white/95 border-b border-stone-200 backdrop-blur-md shrink-0 select-none shadow-2xs">
        {/* Left: Title & Router Badges */}
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-md bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
              <Terminal size={13} />
            </div>
            <h1 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {selectedConversation?.title || "Autonomous Command Center"}
            </h1>
          </div>

          {/* Autonomous Router Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-slate-600">
              Autonomous Router: Claude 3.7 + DeepSeek V3 + Groq Llama
            </span>
          </div>

          {/* Token Savings Badge */}
          <div
            onClick={() => setShowInsightsModal(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-mono font-semibold cursor-pointer hover:bg-orange-100/60 transition-colors shadow-2xs"
            title="Click to view Token Efficiency breakdown"
          >
            <Zap size={11} className="text-orange-600" />
            <span>{tokenStats.contextReductionPercent}% Context Saved</span>
          </div>
        </div>

        {/* Right: Trailing Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-stone-100 active:scale-[0.98] transition-all border-none bg-transparent cursor-pointer"
            title="Share Run link"
          >
            {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
          </button>

          <button
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all border cursor-pointer ${
              isInspectorOpen
                ? "bg-orange-50 border-orange-300 text-orange-600 font-semibold shadow-xs"
                : "bg-white border-stone-200 text-slate-600 hover:text-orange-600 hover:border-orange-200"
            }`}
            title="Toggle Live Telemetry & Artifacts"
          >
            <Activity size={13} className="text-orange-600" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>

          <div className="hidden sm:block h-4 w-[1px] bg-stone-200 mx-1" />

          <button
            onClick={handleExport}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download size={12} />
            <span>Export</span>
          </button>

          <button
            onClick={onExecute}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 shadow-[0_3px_12px_rgba(234,88,12,0.3)] active:scale-[0.98] transition-all border-none cursor-pointer"
          >
            <Play size={12} className="fill-current" />
            <span>{isLoading ? "Running..." : "Execute"}</span>
          </button>
        </div>
      </header>

      {/* Insights Modal */}
      <TokenInsightsModal
        open={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        activeMetrics={latestAssistantMessage?.workflow}
      />
    </>
  );
}
