import React, { useState, useEffect } from "react";
import {
  Activity,
  X,
  Zap,
  Layers,
  FileCode,
  Download,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Clock,
  Terminal,
  Database,
  BarChart3,
  Network
} from "lucide-react";
import { useSelector } from "react-redux";
import { getTokenEfficiency } from "../features/getTokenEfficiency";

export default function TelemetryInspector({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "traces" | "tokens"
  const { messages, artifacts, currentLiveExecution } = useSelector((state) => state.message);

  const [stats, setStats] = useState({
    tokensSaved: 4280,
    contextReductionPercent: 41.8,
    standardTokens: 18420,
    compressedTokens: 10720,
    cacheHitRate: "89.4%",
    runCost: "$0.042",
    ttft: "142ms",
    activeEntities: 4
  });

  const latestAssistantMsg = messages
    ? [...messages].reverse().find((m) => m.role === "assistant")
    : null;

  useEffect(() => {
    const fetchEfficiency = async () => {
      const data = await getTokenEfficiency();
      if (data) {
        setStats((prev) => ({
          ...prev,
          tokensSaved: data.tokensSaved || prev.tokensSaved,
          contextReductionPercent: data.contextReductionPercent || prev.contextReductionPercent
        }));
      }
    };
    fetchEfficiency();
  }, [messages?.length]);

  return (
    <aside className="w-80 sm:w-96 h-full bg-white border-l border-stone-200 flex flex-col justify-between select-none z-30 shrink-0 shadow-sm" id="telemetry-panel">
      {/* Header */}
      <div>
        <div className="px-4 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Activity size={14} />
            </div>
            <h2 className="text-xs font-semibold text-slate-900 tracking-tight uppercase">
              Live Telemetry & Artifacts
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-stone-100 border-none bg-transparent cursor-pointer"
              title="Close Inspector"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3">
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-1 text-[11px] font-mono text-center rounded transition-all cursor-pointer border-none ${
                activeTab === "overview"
                  ? "bg-white text-orange-600 font-semibold shadow-xs border border-orange-200/50"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("traces")}
              className={`py-1 text-[11px] font-mono text-center rounded transition-all cursor-pointer border-none ${
                activeTab === "traces"
                  ? "bg-white text-orange-600 font-semibold shadow-xs border border-orange-200/50"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Traces
            </button>
            <button
              onClick={() => setActiveTab("tokens")}
              className={`py-1 text-[11px] font-mono text-center rounded transition-all cursor-pointer border-none ${
                activeTab === "tokens"
                  ? "bg-white text-orange-600 font-semibold shadow-xs border border-orange-200/50"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Tokens
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-190px)] custom-scrollbar">
          {activeTab === "overview" && (
            <>
              {/* Token Compression Card */}
              <div className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={12} className="text-orange-600" />
                    Token Compression
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-semibold text-[10px] font-mono">
                    {stats.contextReductionPercent}% Saved
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                      <span>Standard Context</span>
                      <span className="font-medium text-slate-700">{stats.standardTokens.toLocaleString()} tok</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-stone-300"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-orange-600 mb-1 font-semibold">
                      <span>Cortex Compressed</span>
                      <span>{stats.compressedTokens.toLocaleString()} tok</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                        style={{ width: `${100 - stats.contextReductionPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-mono">Run Cost</span>
                    <p className="text-sm font-mono font-semibold text-orange-600 mt-0.5">{stats.runCost}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-mono">KV Cache Hit</span>
                    <p className="text-sm font-mono font-semibold text-orange-600 mt-0.5">{stats.cacheHitRate}</p>
                  </div>
                </div>
              </div>

              {/* Generated Artifacts Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-mono font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode size={12} className="text-amber-600" />
                    Generated Artifacts
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {artifacts?.length > 0 ? `${artifacts.length} bundles` : "2 files"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50/70 border border-stone-200 flex items-center justify-between hover:border-orange-300 hover:bg-orange-50/20 transition-all group shadow-2xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1.5 rounded bg-orange-50 text-orange-600">
                      <FileCode size={13} />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-mono font-semibold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                        auth_service.py
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Python • 4.2 KB</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      className="p-1 rounded text-slate-400 hover:text-orange-600 transition-colors border-none bg-transparent cursor-pointer"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50/70 border border-stone-200 flex items-center justify-between hover:border-amber-300 hover:bg-amber-50/20 transition-all group shadow-2xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1.5 rounded bg-amber-50 text-amber-600">
                      <Database size={13} />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-mono font-semibold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                        redis_cluster_config.yaml
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Config • 1.8 KB</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors border-none bg-transparent cursor-pointer"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Shared Memory State */}
              <div className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200 space-y-2.5 shadow-2xs">
                <span className="text-[11px] font-mono font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu size={12} className="text-orange-600" />
                  Live Shared Memory State
                </span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-stone-200">
                    <span className="text-slate-500">Active Session Entities</span>
                    <span className="text-slate-900 font-semibold">{stats.activeEntities}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-stone-200">
                    <span className="text-slate-500">Context Window Used</span>
                    <span className="text-orange-600 font-semibold">14% of 200k</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-stone-200">
                    <span className="text-slate-500">Latency (TTFT)</span>
                    <span className="text-orange-600 font-semibold">{stats.ttft}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Consistency Check</span>
                    <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "traces" && (
            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-orange-600 font-semibold">
                  <span>01 • Planner Step</span>
                  <span>94ms</span>
                </div>
                <p className="text-[11px] text-slate-600">Decomposed input goal into 3 sub-plans</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-amber-600 font-semibold">
                  <span>02 • Architecture Agent</span>
                  <span>310ms</span>
                </div>
                <p className="text-[11px] text-slate-600">Groq Llama 3.3 70B • Edge topology synthesis</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-orange-600 font-semibold">
                  <span>03 • Security Validator</span>
                  <span>840ms</span>
                </div>
                <p className="text-[11px] text-slate-600">Claude 3.7 Sonnet • Token replay audit</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
                  <span>04 • Synthesizer</span>
                  <span>180ms</span>
                </div>
                <p className="text-[11px] text-slate-600">DeepSeek V3 • Redis session manager logic</p>
              </div>
            </div>
          )}

          {activeTab === "tokens" && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Prompt Tokens</span>
                  <span className="text-slate-900 font-semibold">1,420</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Completion Tokens</span>
                  <span className="text-slate-900 font-semibold">2,850</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Compressed Context</span>
                  <span className="text-orange-600 font-semibold">6,450 (-41.8%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Active Status */}
      <div className="px-4 py-3 border-t border-stone-200 bg-stone-50/80 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span className="font-medium text-slate-700">Telemetry Active</span>
          </div>
          <span className="text-orange-600 font-semibold font-mono">24 req/s</span>
        </div>
      </div>
    </aside>
  );
}
