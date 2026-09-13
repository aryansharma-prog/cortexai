import React, { useState, useEffect } from "react";
import { Zap, TrendingDown, BarChart2, Sparkles, ArrowRight } from "lucide-react";
import { getTokenEfficiency } from "../features/getTokenEfficiency";

function CountUp({ end = 0, duration = 900, decimals = 0, suffix = "" }) {
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

export default function TokenEfficiencyWidget({ onViewInsights, activeMetrics = null, compact = false }) {
  const [telemetry, setTelemetry] = useState({
    tokensSaved: 0,
    contextReductionPercent: 0,
    totalExecutions: 0,
    fullContextEstimate: 0,
    cortexContext: 0
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getTokenEfficiency();
      if (mounted && data) {
        let saved = data.tokensSaved || 0;
        let reduction = data.contextReductionPercent || 0;
        let execs = data.totalExecutions || 0;
        let full = data.fullContextEstimate || 0;
        let cortex = data.cortexContext || 0;

        if (activeMetrics?.sharedMemorySummary) {
          const run = activeMetrics.sharedMemorySummary;
          if (run.tokensSavedEstimate > 0 && execs === 0) {
            saved = run.tokensSavedEstimate;
            reduction = run.contextReductionPercent || 0;
            full = run.fullContextTokensEstimate || 0;
            cortex = run.selectedContextTokens || 0;
            execs = 1;
          }
        }

        setTelemetry({
          tokensSaved: saved,
          contextReductionPercent: reduction,
          totalExecutions: execs,
          fullContextEstimate: full,
          cortexContext: cortex
        });
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [activeMetrics]);

  const hasSavings = telemetry.tokensSaved > 0 || telemetry.contextReductionPercent > 0;
  const reductionDisplay = telemetry.contextReductionPercent > 0
    ? `${telemetry.contextReductionPercent}%`
    : "0.0%";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          onClick={onViewInsights}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/[0.08] hover:bg-blue-500/[0.14] border border-blue-500/20 text-blue-300 text-[11px] font-medium cursor-pointer transition-colors"
          title="Token Efficiency: Telemetry-tracked context reduction"
        >
          <Zap size={11} className="text-blue-400" />
          <span>
            {hasSavings ? (
              <>
                <strong className="font-semibold text-slate-100">
                  <CountUp end={telemetry.tokensSaved} />
                </strong>{" "}
                saved (<CountUp end={telemetry.contextReductionPercent} decimals={1} suffix="%" />)
              </>
            ) : (
              "Adaptive Token Efficiency"
            )}
          </span>
        </div>

        <button
          onClick={onViewInsights}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] font-medium border border-white/[0.06] transition-colors cursor-pointer"
        >
          <BarChart2 size={11} className="text-blue-400" />
          <span>Insights</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto py-2 px-3 sm:px-4 rounded-xl border border-white/[0.07] bg-[#0c0e14] flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Zap size={15} />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Token Efficiency
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-slate-100 font-mono tracking-tight">
              <CountUp end={telemetry.tokensSaved} />
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              tokens saved
            </span>
            <span className="text-[11px] font-semibold text-blue-400 font-mono inline-flex items-center gap-0.5">
              <TrendingDown size={11} />
              <CountUp end={telemetry.contextReductionPercent} decimals={1} suffix="%" /> less context
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onViewInsights}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.08] transition-all cursor-pointer"
      >
        <span>View Insights</span>
        <ArrowRight size={12} className="text-blue-400" />
      </button>
    </div>
  );
}
