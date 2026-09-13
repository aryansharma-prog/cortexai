import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Zap,
  Layers,
  Cpu,
  Sliders,
  CheckCircle2,
  Database,
  ArrowDownRight,
  TrendingDown,
  Info
} from "lucide-react";
import { getTokenEfficiency } from "../features/getTokenEfficiency";

function CountUp({ end = 0, duration = 800, suffix = "", decimals = 0 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const finalEnd = Number(end) || 0;
    if (finalEnd === 0) {
      setValue(0);
      return;
    }
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (finalEnd - start) * easeOut;
      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setValue(finalEnd);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [end, duration]);

  const formatted = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString();

  return <span>{formatted}{suffix}</span>;
}

export function TokenInsightsModal({ open, onClose, activeMetrics = null }) {
  const [telemetry, setTelemetry] = useState({
    tokensSaved: 0,
    contextReductionPercent: 0,
    totalExecutions: 0,
    fullContextEstimate: 0,
    cortexContext: 0,
    mechanisms: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const fetchTelemetry = async () => {
      setLoading(true);
      const data = await getTokenEfficiency();
      if (mounted) {
        // If active execution metrics are passed, we can blend with live run data
        let saved = data.tokensSaved || 0;
        let reduction = data.contextReductionPercent || 0;
        let executions = data.totalExecutions || 0;
        let fullContext = data.fullContextEstimate || 0;
        let cortexCtx = data.cortexContext || 0;

        if (activeMetrics?.sharedMemorySummary) {
          const runSaved = activeMetrics.sharedMemorySummary.tokensSavedEstimate || 0;
          const runFull = activeMetrics.sharedMemorySummary.fullContextTokensEstimate || 0;
          const runDelivered = activeMetrics.sharedMemorySummary.selectedContextTokens || 0;
          if (runSaved > 0 && executions === 0) {
            saved = runSaved;
            fullContext = runFull;
            cortexCtx = runDelivered;
            executions = 1;
            reduction = activeMetrics.sharedMemorySummary.contextReductionPercent || 0;
          }
        }

        setTelemetry({
          tokensSaved: saved,
          contextReductionPercent: reduction,
          totalExecutions: executions,
          fullContextEstimate: fullContext,
          cortexContext: cortexCtx,
          mechanisms: data.mechanisms || {}
        });
        setLoading(false);
      }
    };

    fetchTelemetry();
    return () => {
      mounted = false;
    };
  }, [open, activeMetrics]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const reductionPercent = telemetry.contextReductionPercent || (telemetry.fullContextEstimate > 0
    ? Number(((telemetry.tokensSaved / telemetry.fullContextEstimate) * 100).toFixed(1))
    : 0);

  const cortexBarPercent = Math.max(10, Math.min(100, 100 - reductionPercent));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-[620px] bg-[#0f1117] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#13151c]">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Zap size={14} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-slate-100 tracking-tight">
                      Token Efficiency & Context Optimization
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Real-time telemetry on intelligent context reduction and model routing
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5 text-slate-300">
                {/* 3 Metric Cards */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <TrendingDown size={13} className="text-emerald-400" />
                    Token Efficiency Summary
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Card 1: Tokens Saved */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Tokens Saved</span>
                      <div className="text-[20px] sm:text-[22px] font-bold text-slate-100 tracking-tight mt-1">
                        <CountUp end={telemetry.tokensSaved} />
                      </div>
                      <span className="text-[10px] text-emerald-400/90 font-medium mt-1 flex items-center gap-0.5">
                        <ArrowDownRight size={11} /> Context avoided
                      </span>
                    </div>

                    {/* Card 2: Context Reduction */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Context Reduction</span>
                      <div className="text-[20px] sm:text-[22px] font-bold text-emerald-400 tracking-tight mt-1">
                        <CountUp end={reductionPercent} decimals={1} suffix="%" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">
                        vs unoptimized
                      </span>
                    </div>

                    {/* Card 3: Execution Runs */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Execution Runs</span>
                      <div className="text-[20px] sm:text-[22px] font-bold text-slate-100 tracking-tight mt-1">
                        <CountUp end={telemetry.totalExecutions} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">
                        Multi-agent cycles
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Context Comparison Bar */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-200">Context Comparison</span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {reductionPercent > 0 ? `${reductionPercent}% less context used` : "Optimized context baseline"}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Baseline Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Estimated Full Context (Unfiltered)</span>
                        <span className="font-mono text-slate-300">
                          {telemetry.fullContextEstimate > 0
                            ? `${telemetry.fullContextEstimate.toLocaleString()} tokens`
                            : "Baseline"}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden border border-white/[0.05]">
                        <div className="h-full bg-slate-600 rounded-full w-full" />
                      </div>
                    </div>

                    {/* CortexAI Context Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span className="text-slate-200 font-medium flex items-center gap-1">
                          <Zap size={11} className="text-indigo-400" /> CortexAI Context (Selective + Memory)
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {telemetry.cortexContext > 0
                            ? `${telemetry.cortexContext.toLocaleString()} tokens`
                            : `${Math.round(cortexBarPercent)}% of baseline`}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden border border-white/[0.05]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cortexBarPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why Tokens Were Saved (Breakdown) */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info size={13} className="text-indigo-400" />
                    How CortexAI Achieves Token Efficiency
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Item 1: Shared Incremental Memory */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <Database size={13} className="text-indigo-400 shrink-0" />
                        <span>Shared Incremental Memory</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Retains atomic facts and intermediate results in a shared state, eliminating duplicate context transmission across agents.
                      </p>
                    </div>

                    {/* Item 2: Selective Context Scoping */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <Layers size={13} className="text-emerald-400 shrink-0" />
                        <span>Selective Context Scoping</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Delivers only explicit prerequisite subtask outputs to downstream agents rather than appending the entire conversation history.
                      </p>
                    </div>

                    {/* Item 3: Adaptive Agent Routing */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <Cpu size={13} className="text-amber-400 shrink-0" />
                        <span>Adaptive Agent Routing</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Decomposes tasks and routes easy subtasks to low-overhead models (e.g. Llama 3 8B), reserving heavy frontier models for complex reasoning.
                      </p>
                    </div>

                    {/* Item 4: Response Policy Engine */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <Sliders size={13} className="text-cyan-400 shrink-0" />
                        <span>Response Policy Engine</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Dynamically modulates output token budgets (MINIMAL, SHORT, FOCUSED, DETAILED) based on intent and task complexity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/[0.06] bg-[#13151c] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Telemetry sourced from live execution logs & model tracking.
                </span>
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-[12px] font-medium transition-colors border border-white/[0.08]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default TokenInsightsModal;
