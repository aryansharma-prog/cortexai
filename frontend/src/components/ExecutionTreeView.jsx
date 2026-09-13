import React, { useState } from "react";
import {
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Info,
  Sparkles,
  Layers,
  Code2,
  Search,
  FileText,
  Presentation,
  Image as ImageIcon,
  Sliders,
  BarChart3,
  Bot
} from "lucide-react";

const getAgentIcon = (agentType = "") => {
  const clean = String(agentType).toLowerCase();
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

const getComplexityBadge = (classification = "EASY", score = null) => {
  const clean = String(classification).toUpperCase();
  if (clean === "COMPLEX" || (score !== null && score >= 70)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
        COMPLEX {score !== null ? `(${score})` : ""}
      </span>
    );
  }
  if (clean === "MEDIUM" || (score !== null && score >= 40)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        MEDIUM {score !== null ? `(${score})` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      EASY {score !== null ? `(${score})` : ""}
    </span>
  );
};

const getTrustBadge = (trustScore, trustClassification) => {
  if (trustScore === null || trustScore === undefined) return null;
  const score = Number(trustScore);
  const cls = trustClassification || (score >= 85 ? "HIGH" : score >= 60 ? "MEDIUM" : "LOW");

  if (cls === "HIGH" || score >= 85) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
        <ShieldCheck size={11} className="text-emerald-400" />
        {score}/100 High Trust
      </span>
    );
  }
  if (cls === "MEDIUM" || score >= 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
        <ShieldCheck size={11} className="text-amber-400" />
        {score}/100 Med Trust
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
      <ShieldAlert size={11} className="text-rose-400" />
      {score}/100 Low Trust
    </span>
  );
};

const TreeNodeItem = ({ node, isRoot = false }) => {
  const [expanded, setExpanded] = useState(true);
  const [showReason, setShowReason] = useState(false);

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const Icon = getAgentIcon(node.selectedAgent || node.agentType);
  const factors = node.complexityFactors || {};

  if (isRoot) {
    return (
      <div className="space-y-3">
        {hasChildren ? (
          node.children.map(child => (
            <TreeNodeItem key={child.id} node={child} />
          ))
        ) : (
          <div className="text-slate-400 italic text-center py-4">No task tree available.</div>
        )}
      </div>
    );
  }

  return (
    <div className="relative pl-3 border-l border-white/[0.08] my-2 transition-all">
      {/* Node Container Card */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 hover:border-indigo-500/30 hover:bg-white/[0.03] transition-all">
        {/* Top Header Row */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-5 h-5 rounded flex items-center justify-center bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer border-none"
              >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}

            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <Icon size={13} />
            </div>

            <div className="font-semibold text-slate-100 text-[12px] tracking-tight">
              {node.name || node.id}
            </div>

            {/* Depth Badge */}
            {node.depth > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                D{node.depth}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Complexity Badge */}
            {getComplexityBadge(node.classification, node.complexityScore)}

            {/* Trust Badge */}
            {getTrustBadge(node.trustScore, node.trustClassification)}

            {/* Status / Escalation Badge */}
            {node.escalated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <ArrowUpRight size={10} />
                Escalated
              </span>
            )}
          </div>
        </div>

        {/* Task Description */}
        {node.description && (
          <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
            {node.description}
          </div>
        )}

        {/* Five Complexity Factors Chips */}
        {factors && (factors.dependency !== undefined || factors.reasoning !== undefined) && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-white/[0.04] text-[10px] font-mono">
            <span className="text-slate-500">Factors:</span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-indigo-300 border border-white/[0.05]" title="Dependency Factor">
              D:{factors.dependency ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-cyan-300 border border-white/[0.05]" title="Reasoning Steps Factor">
              S:{factors.reasoning ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-amber-300 border border-white/[0.05]" title="Retrieval Requirement Factor">
              R:{factors.retrieval ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-emerald-300 border border-white/[0.05]" title="Computational Difficulty Factor">
              C:{factors.computation ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-purple-300 border border-white/[0.05]" title="Uncertainty Factor">
              U:{factors.uncertainty ?? 0}
            </span>
          </div>
        )}

        {/* Agent Assignment & Model Footer */}
        <div className="flex items-center justify-between flex-wrap gap-2 mt-2.5 pt-2 border-t border-white/[0.04] text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-500">Selected Agent:</span>
            <span className="font-medium text-slate-200">{node.selectedAgent || node.agentType}</span>
            {node.model && (
              <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.06]">
                {node.model}
              </span>
            )}
          </div>

          {node.selectionReason && (
            <button
              onClick={() => setShowReason(!showReason)}
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer bg-transparent border-none p-0"
            >
              <Info size={11} />
              <span>{showReason ? "Hide Rationale" : "Why this Agent?"}</span>
            </button>
          )}
        </div>

        {/* Explainable Rationale Dropdown */}
        {showReason && node.selectionReason && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-black/50 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1.5">
            <div className="font-semibold text-indigo-300 text-[10px] uppercase tracking-wider">
              Selection Decision & Suitability
            </div>
            <p className="text-slate-300 leading-relaxed">{node.selectionReason}</p>
            {Array.isArray(node.alternativesConsidered) && node.alternativesConsidered.length > 0 && (
              <div className="pt-1.5 border-t border-white/[0.06]">
                <div className="text-[10px] text-slate-500 mb-1">Alternatives Evaluated:</div>
                <div className="space-y-1">
                  {node.alternativesConsidered.map((alt, i) => (
                    <div key={i} className="text-[10px] flex items-center justify-between text-slate-400">
                      <span>• {alt.agent}</span>
                      <span className="font-mono text-slate-500">Score: {alt.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Incremental Memory Telemetry Chip */}
        {node.memory && (node.memory.entriesUsed > 0 || node.memory.entriesSkipped > 0) && (
          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/[0.04] text-[10px] font-mono text-slate-400 flex-wrap">
            <span className="text-teal-400 font-semibold">Shared Memory:</span>
            <span>Used: <strong className="text-slate-200">{node.memory.entriesUsed}</strong></span>
            <span>Skipped: <strong className="text-slate-400">{node.memory.entriesSkipped}</strong></span>
            <span>Context: <strong className="text-indigo-300">{node.memory.selectedContextTokens}t</strong></span>
            {node.memory.tokensSavedEstimate > 0 && (
              <span className="text-emerald-400">Saved: <strong>~{node.memory.tokensSavedEstimate}t ({node.memory.contextReductionPercent}%)</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Render Child Subtasks Recursively */}
      {hasChildren && expanded && (
        <div className="mt-1 pl-2">
          {node.children.map(child => (
            <TreeNodeItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ExecutionTreeView({ executionTree = null, workflow = {} }) {
  const tree = executionTree || workflow?.executionTree;
  const policy = workflow?.responsePolicy || workflow?.metrics?.responsePolicy || null;
  const memorySummary = workflow?.sharedMemorySummary || workflow?.metrics?.sharedMemorySummary || null;

  if (!tree) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        <GitBranch size={24} className="mx-auto mb-2 text-slate-600 opacity-60" />
        <span>Execution tree will be generated upon workflow initialization.</span>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Response Policy Engine Bar */}
      {policy && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold">
              RP
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200 text-[11px]">Response Policy: {policy.depth}</span>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/15 px-1.5 py-0.2 rounded border border-indigo-500/20">
                  Target: ~{policy.targetTokens}t {policy.actualTokens ? `(Actual: ${policy.actualTokens}t)` : ""}
                </span>
                {policy.compressionTriggered && (
                  <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                    Compressed
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {policy.reason || `Determined for ${policy.taskType || "task"} at ${policy.taskComplexity || "EASY"} complexity.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>Sections: <strong className={policy.allowSections ? "text-emerald-400" : "text-slate-500"}>{policy.allowSections ? "YES" : "NO"}</strong></span>
            <span>Tables: <strong className={policy.allowTables ? "text-emerald-400" : "text-slate-500"}>{policy.allowTables ? "YES" : "NO"}</strong></span>
          </div>
        </div>
      )}

      {/* Shared Incremental Memory Bar */}
      {memorySummary && memorySummary.entriesCreated > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-teal-950/20 border border-teal-500/20 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-teal-500/20 text-teal-400 font-mono text-[10px] font-bold">
              SIM
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200 text-[11px]">Shared Incremental Memory (v{memorySummary.memoryVersion})</span>
                <span className="text-[10px] font-mono text-teal-300 bg-teal-500/15 px-1.5 py-0.2 rounded border border-teal-500/20">
                  {memorySummary.contextReductionPercent}% Context Reduced
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                Entries: {memorySummary.entriesCreated} created ({memorySummary.entriesUsed} delivered, {memorySummary.entriesSkipped} filtered)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            {memorySummary.tokensSavedEstimate > 0 && (
              <span className="text-emerald-400">Tokens Saved: <strong>~{memorySummary.tokensSavedEstimate}t</strong></span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 px-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <GitBranch size={13} className="text-indigo-400" />
          <span className="font-semibold text-slate-200">Hierarchical Task Tree & Dynamic Selection</span>
        </div>
        <span className="text-[10px] text-slate-500">
          Recursively decomposed into leaf nodes
        </span>
      </div>

      <TreeNodeItem node={tree} isRoot={true} />
    </div>
  );
}
