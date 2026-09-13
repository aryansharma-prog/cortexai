import { Terminal, Zap, BarChart2, MessageSquare } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import TokenInsightsModal from './TokenInsightsModal';
import { getTokenEfficiency } from '../features/getTokenEfficiency';

function Nav({ onOpenInsights }) {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages } = useSelector((state) => state.message);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [tokenStats, setTokenStats] = useState({
    tokensSaved: 0,
    contextReductionPercent: 0,
    totalExecutions: 0
  });

  const latestAssistantMessage = messages
    ? [...messages].reverse().find((m) => m.role === 'assistant' && (m.workflow || m.metrics))
    : null;

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      const data = await getTokenEfficiency();
      if (mounted && data) {
        let reduction = data.contextReductionPercent || 0;
        let saved = data.tokensSaved || 0;
        let execs = data.totalExecutions || 0;

        if (latestAssistantMessage?.workflow?.sharedMemorySummary) {
          const run = latestAssistantMessage.workflow.sharedMemorySummary;
          if (run.tokensSavedEstimate > 0 && execs === 0) {
            reduction = run.contextReductionPercent || 0;
            saved = run.tokensSavedEstimate || 0;
            execs = 1;
          }
        }

        setTokenStats({
          tokensSaved: saved,
          contextReductionPercent: reduction,
          totalExecutions: execs
        });
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, [messages?.length]);

  const handleOpen = () => {
    if (onOpenInsights) {
      onOpenInsights();
    } else {
      setShowInsightsModal(true);
    }
  };

  const displayReduction = tokenStats.contextReductionPercent > 0
    ? `${tokenStats.contextReductionPercent}%`
    : null;

  return (
    <>
      <div className="h-14 flex items-center justify-between pl-14 lg:pl-5 pr-4 sm:pr-6 border-b border-white/[0.06] bg-[#090a0f] shrink-0 gap-3">
        {/* Title / Conversation Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
            {selectedConversation?.title ? (
              <MessageSquare size={13} className="text-blue-400" />
            ) : (
              <Terminal size={13} className="text-blue-400" />
            )}
          </div>
          <div className="text-[13.5px] font-semibold text-slate-100 tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md lg:max-w-lg">
            {selectedConversation?.title || "Cortex Command Center"}
          </div>
        </div>

        {/* Right side: Token Efficiency Indicator + Insights Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Small Token Efficiency Indicator */}
          <div
            onClick={handleOpen}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/[0.08] hover:bg-blue-500/[0.14] border border-blue-500/20 text-blue-300 text-[11px] font-medium cursor-pointer transition-colors"
            title="Intelligent token efficiency: context reduction achieved via Shared Notebook memory"
          >
            <Zap size={11} className="text-blue-400" />
            <span>
              {displayReduction ? `↓ ${displayReduction} less context` : "Token Efficiency Active"}
            </span>
          </div>

          {/* View Insights Button */}
          <button
            onClick={handleOpen}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] font-medium border border-white/[0.07] transition-colors cursor-pointer"
            title="View Token Efficiency Insights"
          >
            <BarChart2 size={11} className="text-blue-400" />
            <span>View Insights</span>
          </button>

          {/* Messages count badge */}
          {messages && messages.length > 0 && (
            <div className="text-[10px] font-mono font-medium text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-full shrink-0 whitespace-nowrap">
              {messages.length} msgs
            </div>
          )}
        </div>
      </div>

      {/* Insights Modal */}
      <TokenInsightsModal
        open={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        activeMetrics={latestAssistantMessage?.workflow}
      />
    </>
  );
}

export default Nav;
