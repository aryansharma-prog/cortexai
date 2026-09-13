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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#faf8f5]">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[11px] font-mono mb-2 font-medium">
            <Activity size={11} className="text-orange-600" />
            <span>Execution Telemetry & Observability</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Execution Runs
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Inspect autonomous execution timelines, dynamic model selections, and Shared Notebook telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRuns}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs transition-all cursor-pointer"
            title="Refresh Runs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-600" : ""} />
          </button>
        </div>
      </div>

      {/* Main Grid: Runs List & Detailed Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Column: Runs Feed */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1 mb-2 font-semibold">
            <span className="text-stone-800">Recent Executions</span>
            <span className="text-[11px] font-mono">{filteredRuns.length} runs</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-stone-400 text-xs">
              <Loader2 size={20} className="animate-spin text-orange-600 mx-auto mb-2" />
              <span>Loading task runs...</span>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="py-12 px-4 rounded-2xl border border-stone-200 bg-white text-center text-xs text-stone-500 shadow-2xs">
              No executions found. Run a task in the Command Center to see live telemetry.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRuns.map((r) => {
                const isSelected = selectedRun?.executionId === r.executionId;
                const tokensSaved = r.sharedMemorySummary?.tokensSavedEstimate || 0;
                const reduction = r.sharedMemorySummary?.contextReductionPercent || 0;

                return (
                  <div
                    key={r.executionId}
                    onClick={() => setSelectedRun(r)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-orange-50/70 border-orange-300 shadow-xs ring-1 ring-orange-500/20"
                        : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-stone-900 line-clamp-1 flex-1">
                        {r.prompt || r.taskType || r.executionId}
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 shrink-0 font-medium">
                        {formatDuration(r.totalDurationMs)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100 text-[10.5px] font-mono flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 font-medium">
                        {r.executionStrategy || "single"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                        {r.complexity || "low"}
                      </span>
                      {tokensSaved > 0 && (
                        <span className="text-orange-600 font-bold inline-flex items-center gap-0.5 ml-auto">
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
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
              {/* Timeline Header */}
              <div className="flex items-start justify-between flex-wrap gap-2 pb-4 border-b border-stone-200">
                <div>
                  <div className="text-[10.5px] font-mono uppercase tracking-widest text-stone-400 font-semibold">
                    Execution Timeline
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 mt-1">
                    "{selectedRun.prompt || selectedRun.taskType || selectedRun.executionId}"
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Completed
                  </span>
                </div>
              </div>

              {/* Step Decomposition Compact Timeline */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider font-semibold">
                  Timeline Flow
                </div>

                <div className="space-y-2 pl-3 border-l-2 border-orange-400 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="font-bold text-stone-900">Task Analyzed</span>
                    <span className="text-[10.5px] font-mono text-stone-500">
                      ({selectedRun.complexity || "medium"} complexity · {selectedRun.taskType || "general"})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="font-bold text-stone-900">Dynamic Capability Routing</span>
                    <span className="text-[10.5px] font-mono text-stone-500">
                      (Strategy: {selectedRun.executionStrategy || "adaptive"})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="font-bold text-stone-900">Model Selected</span>
                    <span className="text-[10.5px] font-mono text-orange-600 font-semibold">
                      Groq Llama 3.3 / Gemini 2.5 Pro
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-stone-900">Shared Notebook Synchronized</span>
                    <span className="text-[10.5px] font-mono text-stone-500">
                      (Delta state preserved)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Completed with Zero Disruption</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-200 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs">
                  <div className="text-[10px] text-stone-400 font-mono font-medium uppercase">Latency</div>
                  <div className="text-xs font-bold font-mono text-stone-900 mt-1">
                    {formatDuration(selectedRun.totalDurationMs)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs">
                  <div className="text-[10px] text-stone-400 font-mono font-medium uppercase">Tokens Saved</div>
                  <div className="text-xs font-bold text-orange-600 font-mono mt-1">
                    {Number(selectedRun.sharedMemorySummary?.tokensSavedEstimate || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs">
                  <div className="text-[10px] text-stone-400 font-mono font-medium uppercase">Context Reduction</div>
                  <div className="text-xs font-bold text-emerald-600 font-mono mt-1">
                    {selectedRun.sharedMemorySummary?.contextReductionPercent || 0}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs">
                  <div className="text-[10px] text-stone-400 font-mono font-medium uppercase">Continuity</div>
                  <div className="text-xs font-bold text-stone-900 mt-1">
                    Zero Disruption
                  </div>
                </div>
              </div>

              {/* Hierarchical Execution Tree if available */}
              {selectedRun.executionTree && (
                <div className="pt-2 border-t border-stone-200">
                  <div className="text-[11px] font-mono text-stone-500 mb-2 uppercase tracking-wider font-semibold">
                    Recursive Decomposition Tree
                  </div>
                  <ExecutionTreeView executionTree={selectedRun.executionTree} />
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 rounded-2xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 text-xs shadow-2xs">
              Select an execution to inspect timeline telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
