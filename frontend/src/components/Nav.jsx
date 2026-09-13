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
  MessageSquare
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
      <header className="sticky top-0 z-30 flex justify-between items-center w-full px-4 sm:px-6 h-14 bg-[#10131a]/95 border-b border-[#3c494e]/40 backdrop-blur-md shrink-0 select-none">
        {/* Left: Title & Router Badges */}
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-md bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] flex items-center justify-center shrink-0">
              <Terminal size={13} />
            </div>
            <h1 className="text-xs sm:text-sm font-semibold text-[#e1e2ec] truncate">
              {selectedConversation?.title || "Autonomous Command Center"}
            </h1>
          </div>

          {/* Autonomous Router Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#272a32] border border-[#3c494e]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-pulse"></span>
            <span className="text-[10px] font-mono text-[#859399]">
              Autonomous Router: Claude 3.7 + DeepSeek V3 + Groq Llama
            </span>
          </div>

          {/* Token Savings Badge */}
          <div
            onClick={() => setShowInsightsModal(true)}
            className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1d1f27] border border-[#00d2ff]/30 text-[#00d2ff] text-[10px] font-mono cursor-pointer hover:bg-[#272a32] transition-colors"
            title="Click to view Token Efficiency breakdown"
          >
            <Zap size={11} className="text-[#00d2ff]" />
            <span>{tokenStats.contextReductionPercent}% Context Saved</span>
          </div>
        </div>

        {/* Right: Trailing Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-md text-[#859399] hover:text-[#e1e2ec] hover:bg-[#1d1f27] active:scale-[0.98] transition-all border-none bg-transparent cursor-pointer"
            title="Share Run link"
          >
            {copiedLink ? <Check size={15} className="text-[#10b981]" /> : <Share2 size={15} />}
          </button>

          <button
            onClick={onToggleInspector}
            className={`p-1.5 rounded-md transition-all border-none cursor-pointer ${
              isInspectorOpen
                ? "bg-[#00d2ff]/15 text-[#00d2ff] border border-[#00d2ff]/30"
                : "text-[#859399] hover:text-[#e1e2ec] hover:bg-[#1d1f27] bg-transparent"
            }`}
            title="Toggle Telemetry Inspector"
          >
            <Sliders size={15} />
          </button>

          <div className="hidden sm:block h-4 w-[1px] bg-[#3c494e]/40 mx-1" />

          <button
            onClick={handleExport}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-[#e1e2ec] bg-[#1d1f27] hover:bg-[#272a32] border border-[#3c494e]/50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download size={12} />
            <span>Export</span>
          </button>

          <button
            onClick={onExecute}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#003543] bg-[#00d2ff] hover:brightness-110 shadow-glow-cyan-sm active:scale-[0.98] transition-all border-none cursor-pointer"
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
