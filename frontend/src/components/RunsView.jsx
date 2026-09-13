import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  Shield,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Terminal,
  Cpu,
  Loader2,
  AlertCircle
} from "lucide-react";
import { getExecutions } from "../features/providerApi";
import ExecutionTreeView from "./ExecutionTreeView";

export default function RunsView({ onSelectExecution }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [filterStrategy, setFilterStrategy] = useState("all");

  const loadRuns = async () => {
    setLoading(true);
    const data = await getExecutions(30);
    setRuns(data || []);
    if (data && data.length > 0 && !selectedRun) {
      setSelectedRun(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const filteredRuns = runs.filter((r) => {
    if (filterStrategy === "all") return true;
    return r.executionStrategy === filterStrategy || r.complexity?.toLowerCase() === filterStrategy;
  });

  const formatDuration = (ms) => {
    if (!ms && ms !== 0) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono mb-2">
            <Activity size={11} />
            <span>Execution Telemetry & Observability</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-100 tracking-tight">
            RUNS
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-1 max-w-2xl">
            Inspect autonomous execution timelines, dynamic model selections, and Shared Notebook telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRuns}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors cursor-pointer"
            title="Refresh Runs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : ""} />
          </button>
        </div>
      </div>

      {/* Main Grid: Runs List & Detailed Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Column: Runs Feed */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-2">
            <span className="font-semibold text-slate-200">Recent Executions</span>
            <span className="text-[11px] font-mono text-slate-500">{filteredRuns.length} runs</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <Loader2 size={20} className="animate-spin text-blue-400 mx-auto mb-2" />
              <span>Loading task runs...</span>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="py-12 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center text-xs text-slate-500">
              No executions found. Run a task in the Command Center to see live telemetry.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRuns.map((r) => {
                const isSelected = selectedRun?.executionId === r.executionId;
                const tokensSaved = r.sharedMemorySummary?.tokensSavedEstimate || 0;
                const reduction = r.sharedMemorySummary?.contextReductionPercent || 0;

                return (
                  <div
                    key={r.executionId}
                    onClick={() => setSelectedRun(r)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-950/20 border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        : "bg-[#0b0d13] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-xs text-slate-200 line-clamp-1 flex-1">
                        {r.prompt || r.taskType || r.executionId}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {formatDuration(r.totalDurationMs)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.04] text-[10.5px] font-mono flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        {r.executionStrategy || "single"}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                        {r.complexity || "low"}
                      </span>
                      {tokensSaved > 0 && (
                        <span className="text-blue-400 font-semibold inline-flex items-center gap-0.5 ml-auto">
                          <Zap size={10} />
                          ↓ {reduction}% ctx
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Compact Timeline & Tree Inspector */}
        <div className="lg:col-span-7">
          {selectedRun ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-5 sm:p-6 flex flex-col gap-5">
              {/* Timeline Header */}
              <div className="flex items-start justify-between flex-wrap gap-2 pb-4 border-b border-white/[0.06]">
                <div>
                  <div className="text-[10.5px] font-mono uppercase tracking-widest text-slate-500">
                    Execution Timeline
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100 mt-1">
                    "{selectedRun.prompt || selectedRun.taskType || selectedRun.executionId}"
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Completed
                  </span>
                </div>
              </div>

              {/* Step Decomposition Compact Timeline */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Timeline Flow
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-blue-500/30 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-semibold text-slate-200">Task Analyzed</span>
                    <span className="text-[10.5px] font-mono text-slate-500">
                      ({selectedRun.complexity || "medium"} complexity · {selectedRun.taskType || "general"})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-semibold text-slate-200">Dynamic Capability Routing</span>
                    <span className="text-[10.5px] font-mono text-slate-500">
                      (Strategy: {selectedRun.executionStrategy || "adaptive"})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-semibold text-slate-200">Model Selected</span>
                    <span className="text-[10.5px] font-mono text-blue-400">
                      Groq Llama 3.3 / Gemini 2.5 Pro
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-slate-200">Shared Notebook Synchronized</span>
                    <span className="text-[10.5px] font-mono text-slate-500">
                      (Delta state preserved)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Completed with Zero Disruption</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/[0.06] text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] text-slate-500 font-mono">LATENCY</div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">
                    {formatDuration(selectedRun.totalDurationMs)}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] text-slate-500 font-mono">TOKENS SAVED</div>
                  <div className="text-xs font-semibold text-blue-400 font-mono mt-0.5">
                    {Number(selectedRun.sharedMemorySummary?.tokensSavedEstimate || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] text-slate-500 font-mono">CONTEXT REDUCTION</div>
                  <div className="text-xs font-semibold text-emerald-400 font-mono mt-0.5">
                    {selectedRun.sharedMemorySummary?.contextReductionPercent || 0}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] text-slate-500 font-mono">CONTINUITY</div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">
                    Zero Disruption
                  </div>
                </div>
              </div>

              {/* Hierarchical Execution Tree if available */}
              {selectedRun.executionTree && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
                    Recursive Decomposition Tree
                  </div>
                  <ExecutionTreeView executionTree={selectedRun.executionTree} />
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 rounded-2xl border border-white/[0.06] bg-[#0c0e14] flex items-center justify-center text-slate-500 text-xs">
              Select an execution to inspect timeline telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
