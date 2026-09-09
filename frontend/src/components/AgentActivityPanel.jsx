import React, { useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  GitBranch,
  Layers,
  Loader2,
  Sparkles,
  Zap,
  AlertCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Search,
  Code2,
  FileText,
  Presentation,
  Image as ImageIcon,
  Sliders
} from "lucide-react";

const getAgentIcon = (agentType = "") => {
  const clean = agentType.toLowerCase();
  if (clean.includes("search")) return Search;
  if (clean.includes("code") || clean.includes("coding")) return Code2;
  if (clean.includes("pdf")) return FileText;
  if (clean.includes("ppt")) return Presentation;
  if (clean.includes("image") || clean.includes("vision")) return ImageIcon;
  if (clean.includes("analy") || clean.includes("financial")) return BarChart3;
  if (clean.includes("comp") || clean.includes("market")) return Sliders;
  if (clean.includes("synth") || clean.includes("report")) return Sparkles;
  return Bot;
};

const getStatusBadge = (status = "completed") => {
  switch (status) {
    case "running":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Working
        </span>
      );
    case "waiting":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Waiting
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle size={11} />
          Failed
        </span>
      );
    case "completed":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <CheckCircle2 size={11} className="text-indigo-400" />
          Completed
        </span>
      );
  }
};

const formatTokens = (num) => {
  if (num === null || num === undefined) return "—";
  return Number(num).toLocaleString();
};

const formatDuration = (ms) => {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatCost = (cost) => {
  if (cost === null || cost === undefined) return "Cost unavailable";
  if (cost === 0) return "$0.0000";
  return `$${cost.toFixed(4)}`;
};

export default function AgentActivityPanel({ workflow = {}, metrics = {} }) {
  const [showTelemetry, setShowTelemetry] = useState(false);

  const subtasks = workflow?.subtasks || [];
  const strategy = workflow?.executionStrategy || "single";
  const complexity = workflow?.complexity || "low";
  const scores = workflow?.scores || {};

  const totalAgents = metrics?.totalAgents || (subtasks.length > 0 ? subtasks.length : 1);
  const completedAgents = metrics?.completedAgents || subtasks.filter(s => s.status === "completed").length;
  const totalTokens = metrics?.totalTokens;
  const totalDuration = metrics?.totalDurationMs ? formatDuration(metrics.totalDurationMs) : (metrics?.totalDurationSec ? `${metrics.totalDurationSec}s` : "—");
  const estimatedCost = metrics?.estimatedCost;

  return (
    <div className="mt-3 w-full rounded-xl border border-white/[0.08] bg-[#11131a] overflow-hidden text-slate-300 text-xs shadow-xl transition-all">
      {/* Header bar */}
      <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity size={13} />
          </div>
          <span className="font-semibold text-slate-100 text-[13px] tracking-tight">Agent Activity & Execution</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Strategy Badge */}
          <span className="px-2.5 py-0.5 rounded-full font-medium text-[10px] uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {strategy === "hybrid" ? "Hybrid Workflow" : strategy === "parallel" ? "Parallel DAG" : strategy === "sequential" ? "Sequential Chain" : "Single Agent"}
          </span>

          {/* Complexity Badge */}
          <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] uppercase tracking-wider border ${
            complexity === "high"
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
              : complexity === "medium"
              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
              : "bg-slate-500/15 text-slate-300 border-slate-500/30"
          }`}>
            {complexity} Complexity
          </span>
        </div>
      </div>

      {/* Workflow Visual Flow Pipeline */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
        <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
          <GitBranch size={12} className="text-slate-400" />
          <span>Execution Graph Pipeline</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Task Analyzer Node */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] shrink-0 text-slate-300">
            <Cpu size={12} className="text-violet-400" />
            <span className="font-medium text-[11px]">Task Analyzer</span>
          </div>

          <span className="text-slate-600 font-bold shrink-0">→</span>

          {/* Subtask Nodes */}
          {subtasks.length > 0 ? (
            subtasks.map((st, idx) => {
              const Icon = getAgentIcon(st.agentType || st.id);
              const isParallel = subtasks.length > 1 && (!st.dependencies || st.dependencies.length === 0);
              return (
                <React.Fragment key={st.id || idx}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shrink-0 ${
                    st.status === "running"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : st.status === "failed"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : "bg-white/[0.04] border-white/[0.08] text-slate-200"
                  }`}>
                    <Icon size={12} className={st.status === "running" ? "text-emerald-400 animate-spin" : "text-indigo-400"} />
                    <span className="font-medium text-[11px]">{st.name || st.agentType}</span>
                    {isParallel && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">parallel</span>
                    )}
                  </div>

                  {idx < subtasks.length - 1 && (
                    <span className="text-slate-600 font-bold shrink-0">→</span>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] shrink-0 text-slate-200">
              <Bot size={12} className="text-indigo-400" />
              <span className="font-medium text-[11px]">General Agent</span>
            </div>
          )}

          {/* Synthesizer Node (shown if multi-agent) */}
          {subtasks.length > 1 && (
            <>
              <span className="text-slate-600 font-bold shrink-0">→</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/30 shrink-0 text-indigo-200">
                <Sparkles size={12} className="text-violet-400" />
                <span className="font-medium text-[11px]">Synthesizer</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Agents Execution Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] uppercase font-semibold text-slate-500 bg-white/[0.01]">
              <th className="py-2.5 px-4">Agent / Subtask</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Model</th>
              <th className="py-2.5 px-3">Tokens</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {subtasks.length > 0 ? (
              subtasks.map((st, i) => {
                const Icon = getAgentIcon(st.agentType || st.id);
                const m = st.metrics || {};
                return (
                  <tr key={st.id || i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-indigo-400 shrink-0" />
                        <div>
                          <div className="font-medium text-slate-200 text-[12px]">{st.name || st.agentType}</div>
                          {st.activitySummary && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[240px]">
                              {st.activitySummary}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStatusBadge(st.status || "completed")}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {m.model || (st.agentType === "coding" ? "DeepSeek" : st.agentType === "imageAnalyzer" ? "Gemini 2.5" : "GPT-OSS")}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      {formatTokens(m.totalTokens)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      {formatDuration(m.durationMs)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {formatCost(m.estimatedCost)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 px-4 flex items-center gap-2">
                  <Bot size={14} className="text-indigo-400" />
                  <span className="font-medium text-slate-200">Reasoning Agent</span>
                </td>
                <td className="py-2.5 px-3">{getStatusBadge("completed")}</td>
                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">GPT-OSS</td>
                <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{formatTokens(totalTokens)}</td>
                <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{totalDuration}</td>
                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{formatCost(estimatedCost)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Aggregate Workflow Summary Footer */}
      <div className="px-4 py-3 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-indigo-400" />
            <span className="text-slate-400">Total Agents:</span>
            <span className="font-semibold text-slate-200">{totalAgents} ({completedAgents} completed)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" />
            <span className="text-slate-400">Total Tokens:</span>
            <span className="font-semibold text-slate-200 font-mono">{formatTokens(totalTokens)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-cyan-400" />
            <span className="text-slate-400">Total Latency:</span>
            <span className="font-semibold text-slate-200 font-mono">{totalDuration}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Coins size={13} className="text-emerald-400" />
            <span className="text-slate-400">Estimated Cost:</span>
            <span className="font-semibold text-slate-200 font-mono">{formatCost(estimatedCost)}</span>
          </div>
        </div>

        {/* Telemetry toggle button */}
        <button
          onClick={() => setShowTelemetry(!showTelemetry)}
          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <span>Research Scores</span>
          {showTelemetry ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Collapsible Scientific Research Telemetry */}
      {showTelemetry && (
        <div className="px-4 py-3 bg-black/40 border-t border-white/[0.06] text-[11px]">
          <div className="text-slate-400 font-medium mb-2 flex items-center gap-1.5">
            <BarChart3 size={12} className="text-indigo-400" />
            <span>Task Decomposition & Research Metrics (1-10 Scale)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className="text-[10px] text-slate-500">Complexity</div>
              <div className="text-[14px] font-bold text-indigo-400 font-mono">{scores?.complexityScore ?? 1}/10</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className="text-[10px] text-slate-500">Decomposability</div>
              <div className="text-[14px] font-bold text-cyan-400 font-mono">{scores?.decomposabilityScore ?? 1}/10</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className="text-[10px] text-slate-500">Dependency</div>
              <div className="text-[14px] font-bold text-violet-400 font-mono">{scores?.dependencyScore ?? 1}/10</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className="text-[10px] text-slate-500">Tool Needs</div>
              <div className="text-[14px] font-bold text-amber-400 font-mono">{scores?.toolRequirementScore ?? 1}/10</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className="text-[10px] text-slate-500">Risk Score</div>
              <div className="text-[14px] font-bold text-emerald-400 font-mono">{scores?.riskScore ?? 1}/10</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
