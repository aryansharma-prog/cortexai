import { MessageSquare, Zap, BarChart2 } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import TokenInsightsModal from './TokenInsightsModal'
import { getTokenEfficiency } from '../features/getTokenEfficiency'

function Nav() {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages } = useSelector(state => state.message)
  const [showInsights, setShowInsights] = useState(false)
  const [tokenStats, setTokenStats] = useState({
    tokensSaved: 0,
    contextReductionPercent: 0,
    totalExecutions: 0
  })

  // Find latest assistant message that contains workflow or sharedMemorySummary
  const latestAssistantMessage = messages
    ? [...messages].reverse().find(m => m.role === 'assistant' && (m.workflow || m.metrics))
    : null;

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      const data = await getTokenEfficiency();
      if (mounted && data) {
        let reduction = data.contextReductionPercent || 0;
        let saved = data.tokensSaved || 0;
        let execs = data.totalExecutions || 0;

        // Fallback to active message telemetry if DB has 0
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

  const displayReduction = tokenStats.contextReductionPercent > 0
    ? `${tokenStats.contextReductionPercent}%`
    : null;

  return (
    <>
      <div className='h-14 flex items-center justify-between pl-14 lg:pl-5 pr-4 sm:pr-5 border-b border-white/[0.06] bg-[#0d0f14] shrink-0 gap-3'>
        {/* Title / Conversation details */}
        <div className='flex items-center gap-2.5 min-w-0'>
          <div className='flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0'>
            <MessageSquare size={13} className="text-indigo-400"/>
          </div>
          <div className='text-[14px] font-semibold text-slate-100 tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md lg:max-w-lg'>
            {selectedConversation?.title || "New Chat"}
          </div>
        </div>

        {/* Right side: Token Efficiency Indicator + Insights Button + Message Count */}
        <div className='flex items-center gap-2 sm:gap-2.5 shrink-0'>
          {/* Small Token Efficiency Indicator */}
          <div
            onClick={() => setShowInsights(true)}
            className='hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12] border border-emerald-500/20 text-emerald-300 text-[11px] font-medium cursor-pointer transition-colors'
            title="Intelligent token efficiency: context reduction achieved via shared memory & adaptive routing"
          >
            <Zap size={12} className="text-emerald-400" />
            <span>
              {displayReduction ? `↓ ${displayReduction} less context` : "Token Efficient"}
            </span>
          </div>

          {/* View Insights Button */}
          <button
            onClick={() => setShowInsights(true)}
            className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-slate-100 text-[11px] font-medium border border-white/[0.06] transition-colors cursor-pointer'
            title="View Token Efficiency Insights"
          >
            <BarChart2 size={12} className="text-indigo-400" />
            <span className="hidden xs:inline sm:inline">View Insights</span>
            <span className="inline xs:hidden sm:hidden">Insights</span>
          </button>

          {/* Messages count badge */}
          <div className='text-[10px] font-medium text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-full shrink-0 whitespace-nowrap'>
            {messages?.length || 0} msgs
          </div>
        </div>
      </div>

      {/* Insights Modal */}
      <TokenInsightsModal
        open={showInsights}
        onClose={() => setShowInsights(false)}
        activeMetrics={latestAssistantMessage?.workflow}
      />
    </>
  )
}

export default Nav

