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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
        COMPLEX {score !== null ? `(${score})` : ""}
      </span>
    );
  }
  if (clean === "MEDIUM" || (score !== null && score >= 40)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        MEDIUM {score !== null ? `(${score})` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck size={11} className="text-emerald-600" />
        {score}/100 High Trust
      </span>
    );
  }
  if (cls === "MEDIUM" || score >= 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <ShieldCheck size={11} className="text-amber-600" />
        {score}/100 Med Trust
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <ShieldAlert size={11} className="text-rose-600" />
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
          <div className="text-stone-400 italic text-center py-4">No task tree available.</div>
        )}
      </div>
    );
  }

  return (
    <div className="relative pl-3 border-l-2 border-stone-200 my-2 transition-all">
      {/* Node Container Card */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 hover:border-orange-300 hover:bg-orange-50/20 transition-all shadow-2xs">
        {/* Top Header Row */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-5 h-5 rounded flex items-center justify-center bg-white text-stone-500 hover:text-stone-900 border border-stone-200 transition-colors cursor-pointer"
              >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}

            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-50 border border-orange-200/80 text-orange-600 shrink-0">
              <Icon size={13} />
            </div>

            <div className="font-bold text-stone-900 text-[12px] tracking-tight">
              {node.name || node.id}
            </div>

            {/* Depth Badge */}
            {node.depth > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white text-stone-500 border border-stone-200 font-medium">
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                <ArrowUpRight size={10} />
                Escalated
              </span>
            )}
          </div>
        </div>

        {/* Task Description */}
        {node.description && (
          <div className="text-[11px] text-stone-600 mt-1.5 leading-relaxed line-clamp-2">
            {node.description}
          </div>
        )}

        {/* Five Complexity Factors Chips */}
        {factors && (factors.dependency !== undefined || factors.reasoning !== undefined) && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-stone-200/70 text-[10px] font-mono">
            <span className="text-stone-400 font-medium">Factors:</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-orange-700 border border-stone-200" title="Dependency Factor">
              D:{factors.dependency ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white text-stone-700 border border-stone-200" title="Reasoning Steps Factor">
              S:{factors.reasoning ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white text-amber-700 border border-stone-200" title="Retrieval Requirement Factor">
              R:{factors.retrieval ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white text-emerald-700 border border-stone-200" title="Computational Difficulty Factor">
              C:{factors.computation ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white text-stone-600 border border-stone-200" title="Uncertainty Factor">
              U:{factors.uncertainty ?? 0}
            </span>
          </div>
        )}

        {/* Agent Assignment & Model Footer */}
        <div className="flex items-center justify-between flex-wrap gap-2 mt-2.5 pt-2 border-t border-stone-200/70 text-[11px]">
          <div className="flex items-center gap-2 text-stone-700">
            <span className="text-stone-400">Selected Agent:</span>
            <span className="font-bold text-stone-900">{node.selectedAgent || node.agentType}</span>
            {node.model && (
              <span className="text-[10px] text-stone-600 font-mono font-medium px-1.5 py-0.5 rounded bg-white border border-stone-200">
                {node.model}
              </span>
            )}
          </div>

          {node.selectionReason && (
            <button
              onClick={() => setShowReason(!showReason)}
              className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer bg-transparent border-none p-0"
            >
              <Info size={11} />
              <span>{showReason ? "Hide Rationale" : "Why this Agent?"}</span>
            </button>
          )}
        </div>

        {/* Explainable Rationale Dropdown */}
        {showReason && node.selectionReason && (
          <div className="mt-2.5 p-3 rounded-xl bg-white border border-stone-200 text-[11px] text-stone-700 space-y-1.5 shadow-2xs">
            <div className="font-bold text-orange-700 text-[10px] uppercase tracking-wider font-mono">
              Selection Decision & Suitability
            </div>
            <p className="text-stone-600 leading-relaxed">{node.selectionReason}</p>
            {Array.isArray(node.alternativesConsidered) && node.alternativesConsidered.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <div className="text-[10px] text-stone-400 font-mono mb-1 font-medium">Alternatives Evaluated:</div>
                <div className="space-y-1">
                  {node.alternativesConsidered.map((alt, i) => (
                    <div key={i} className="text-[10px] flex items-center justify-between text-stone-600">
                      <span>• {alt.agent}</span>
                      <span className="font-mono text-stone-500 font-medium">Score: {alt.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Incremental Memory Telemetry Chip */}
        {node.memory && (node.memory.entriesUsed > 0 || node.memory.entriesSkipped > 0) && (
          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-stone-200/70 text-[10px] font-mono text-stone-500 flex-wrap">
            <span className="text-orange-600 font-bold">Shared Memory:</span>
            <span>Used: <strong className="text-stone-800">{node.memory.entriesUsed}</strong></span>
            <span>Skipped: <strong className="text-stone-500">{node.memory.entriesSkipped}</strong></span>
            <span>Context: <strong className="text-orange-700">{node.memory.selectedContextTokens}t</strong></span>
            {node.memory.tokensSavedEstimate > 0 && (
              <span className="text-emerald-700 font-bold">Saved: <strong>~{node.memory.tokensSavedEstimate}t ({node.memory.contextReductionPercent}%)</strong></span>
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
      <div className="p-6 text-center text-stone-400 text-xs">
        <GitBranch size={24} className="mx-auto mb-2 text-stone-300" />
        <span>Execution tree will be generated upon workflow initialization.</span>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Response Policy Engine Bar */}
      {policy && (
        <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-orange-50/60 border border-orange-200 text-xs flex items-center justify-between flex-wrap gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-mono text-[10px] font-bold shadow-2xs">
              RP
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-[11px]">Response Policy: {policy.depth}</span>
                <span className="text-[10px] font-mono font-semibold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded border border-orange-200">
                  Target: ~{policy.targetTokens}t {policy.actualTokens ? `(Actual: ${policy.actualTokens}t)` : ""}
                </span>
                {policy.compressionTriggered && (
                  <span className="text-[9px] uppercase font-bold text-orange-800 bg-orange-200/80 px-1.5 py-0.2 rounded border border-orange-300">
                    Compressed
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {policy.reason || `Determined for ${policy.taskType || "task"} at ${policy.taskComplexity || "EASY"} complexity.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-stone-600 font-mono">
            <span>Sections: <strong className={policy.allowSections ? "text-emerald-700" : "text-stone-400"}>{policy.allowSections ? "YES" : "NO"}</strong></span>
            <span>Tables: <strong className={policy.allowTables ? "text-emerald-700" : "text-stone-400"}>{policy.allowTables ? "YES" : "NO"}</strong></span>
          </div>
        </div>
      )}

      {/* Shared Incremental Memory Bar */}
      {memorySummary && memorySummary.entriesCreated > 0 && (
        <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs flex items-center justify-between flex-wrap gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold shadow-2xs">
              SIM
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-[11px]">Shared Incremental Memory (v{memorySummary.memoryVersion})</span>
                <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                  {memorySummary.contextReductionPercent}% Context Reduced
                </span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                Entries: {memorySummary.entriesCreated} created ({memorySummary.entriesUsed} delivered, {memorySummary.entriesSkipped} filtered)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-stone-600 font-mono">
            {memorySummary.tokensSavedEstimate > 0 && (
              <span className="text-emerald-700 font-bold">Tokens Saved: <strong>~{memorySummary.tokensSavedEstimate}t</strong></span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 px-1 text-[11px] text-stone-500 font-semibold">
        <div className="flex items-center gap-1.5">
          <GitBranch size={13} className="text-orange-600" />
          <span className="text-stone-800">Hierarchical Task Tree & Dynamic Selection</span>
        </div>
        <span className="text-[10px] text-stone-400 font-mono font-normal">
          Recursively decomposed into leaf nodes
        </span>
      </div>

      <TreeNodeItem node={tree} isRoot={true} />
    </div>
  );
}
