import React, { useState } from "react";
import {
  Shield,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Cortex Continuity Visual & Architecture Showcase
 */
export function CortexContinuitySection({ compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-950/10 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Shield size={12} />
          </div>
          <div>
            <span className="font-semibold text-slate-200">Cortex Continuity:</span>{" "}
            <span className="text-slate-400">Zero-disruption multi-provider failover active.</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
          ● Protected
        </span>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0d1017] p-5 sm:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono mb-1.5">
            <Shield size={11} />
            <span>Resilient Execution Architecture</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight">
            CORTEX CONTINUITY
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-0.5">
            Your task continues even when a connected model becomes unavailable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Failover Engine
          </span>
        </div>
      </div>

      {/* Visual Execution Flow Pipeline */}
      <div className="my-5 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
        <div className="text-[10.5px] font-mono uppercase tracking-widest text-slate-500 mb-3">
          Automated Model Handover Flow
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 items-center text-xs">
          {/* Node 1: Initial Model */}
          <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.02] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Gemini</span>
              <span className="text-[10px] font-mono text-blue-400">Executing</span>
            </div>
            <span className="text-[10px] text-slate-500">Decomposed subtask A</span>
          </div>

          {/* Transition 1: Limit Event */}
          <div className="flex md:flex-col items-center justify-center gap-1 text-slate-500">
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Rate Limit / Quota
            </span>
            <ArrowRight size={14} className="hidden md:block text-slate-600 my-1" />
          </div>

          {/* Node 2: Cortex Continuity Router */}
          <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/20 flex flex-col gap-1 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-300">Cortex Continuity</span>
              <RefreshCw size={12} className="text-blue-400 animate-spin" />
            </div>
            <span className="text-[10px] text-slate-400">Syncs Shared Notebook</span>
          </div>

          {/* Transition 2: Handover */}
          <div className="flex md:flex-col items-center justify-center gap-1 text-slate-500">
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              Preserved Delta
            </span>
            <ArrowRight size={14} className="hidden md:block text-slate-600 my-1" />
          </div>

          {/* Node 3: Continuing Model */}
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/15 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-300">Claude / Groq</span>
              <span className="text-[10px] font-mono text-emerald-400">Continuing</span>
            </div>
            <span className="text-[10px] text-slate-400">Uninterrupted final delivery</span>
          </div>
        </div>
      </div>

      {/* Guarantee Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
          <span>Task state strictly preserved</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
          <span>Relevant memory transferred</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
          <span>Continuing from previous step</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Runtime Model-Switch Banner (Non-alarming, reassuring UI)
 */
export function ModelSwitchIndicator({
  fromModel = "Gemini",
  toModel = "Claude",
  reason = "Temporary rate limit encountered"
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="p-3 rounded-xl border border-blue-500/30 bg-blue-950/30 backdrop-blur text-xs text-slate-200 my-2 flex flex-col gap-2 shadow-lg"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span className="font-semibold text-blue-300">Cortex Continuity:</span>
          <span className="text-slate-300">{fromModel} became temporarily unavailable.</span>
        </div>
        <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
          Re-routing your task...
        </span>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pl-4 border-l border-blue-500/30">
        <span>{fromModel}</span>
        <ArrowRight size={11} className="text-blue-400" />
        <span className="text-blue-300 font-semibold">Cortex Router</span>
        <ArrowRight size={11} className="text-blue-400" />
        <span className="text-emerald-300 font-semibold">{toModel}</span>
      </div>

      <div className="flex items-center gap-4 text-[10.5px] text-slate-400 pl-4">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={11} className="text-emerald-400" />
          Task state preserved
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={11} className="text-emerald-400" />
          Shared Notebook synchronized
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={11} className="text-emerald-400" />
          Continuing execution
        </span>
      </div>
    </motion.div>
  );
}

export default CortexContinuitySection;
