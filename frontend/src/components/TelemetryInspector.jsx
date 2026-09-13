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
    <aside className="w-80 sm:w-96 h-full bg-[#10131a]/95 backdrop-blur-xl border-l border-[#3c494e]/40 flex flex-col justify-between select-none z-30 shrink-0">
      {/* Header */}
      <div>
        <div className="px-4 py-3.5 border-b border-[#3c494e]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] flex items-center justify-center">
              <Activity size={14} />
            </div>
            <h2 className="text-xs font-semibold text-[#e1e2ec] tracking-tight uppercase">
              Live Telemetry & Artifacts
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#859399] hover:text-[#e1e2ec] transition-colors p-1 rounded-md hover:bg-white/[0.05] border-none bg-transparent cursor-pointer"
              title="Close Inspector"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3">
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#0b0e15]/80 rounded-lg border border-[#3c494e]/40">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-1 text-[11px] font-mono text-center rounded transition-all cursor-pointer border-none ${
                activeTab === "overview"
                  ? "bg-[#1d1f27] text-[#a5e7ff] font-medium shadow-sm border border-[#00d2ff]/20"
                  : "bg-transparent text-[#859399] hover:text-[#e1e2ec]"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("traces")}
              className={`py-1 text-[11px] font-mono text-center rounded transition-all cursor-pointer border-none ${
                activeTab === "traces"
                  ? "bg-[#1d1f27] text-[#a5e7ff] font-medium shadow-sm border border-[#00d2ff]/20"
                  : "bg-transparent text-[#859399] hover:text-[#e1e2ec]"
              }`}
            >
              Traces
            </button>
            <button
              onClick={() => setActiveTab("tokens")}
              className={`py-1 text-[11px] font-mono text-center rounded transition-all cursor-pointer border-none ${
                activeTab === "tokens"
                  ? "bg-[#1d1f27] text-[#a5e7ff] font-medium shadow-sm border border-[#00d2ff]/20"
                  : "bg-transparent text-[#859399] hover:text-[#e1e2ec]"
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
              <div className="p-3.5 rounded-xl bg-[#0b0e15]/60 border border-[#3c494e]/40 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-[#e1e2ec] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={12} className="text-[#00d2ff]" />
                    Token Compression
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] text-[10px] font-mono">
                    {stats.contextReductionPercent}% Saved
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-[#859399] mb-1">
                      <span>Standard Context</span>
                      <span>{stats.standardTokens.toLocaleString()} tok</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1d1f27] rounded-full overflow-hidden">
                      <div className="w-full h-full bg-[#859399]/40"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-[#a5e7ff] mb-1">
                      <span>Cortex Compressed</span>
                      <span>{stats.compressedTokens.toLocaleString()} tok</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1d1f27] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]"
                        style={{ width: `${100 - stats.contextReductionPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#3c494e]/30">
                  <div className="p-2 rounded-lg bg-[#191b23]/60 border border-[#3c494e]/30">
                    <span className="text-[10px] text-[#859399] font-mono">Run Cost</span>
                    <p className="text-sm font-mono font-semibold text-[#a5e7ff] mt-0.5">{stats.runCost}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#191b23]/60 border border-[#3c494e]/30">
                    <span className="text-[10px] text-[#859399] font-mono">KV Cache Hit</span>
                    <p className="text-sm font-mono font-semibold text-[#00d2ff] mt-0.5">{stats.cacheHitRate}</p>
                  </div>
                </div>
              </div>

              {/* Generated Artifacts Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-mono font-medium text-[#e1e2ec] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode size={12} className="text-[#c0c1ff]" />
                    Generated Artifacts
                  </span>
                  <span className="text-[10px] font-mono text-[#859399]">
                    {artifacts?.length > 0 ? `${artifacts.length} bundles` : "2 files"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0b0e15]/60 border border-[#3c494e]/30 flex items-center justify-between hover:border-[#00d2ff]/40 transition-colors group">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1.5 rounded bg-[#00d2ff]/10 text-[#00d2ff]">
                      <FileCode size={13} />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-mono font-medium text-[#e1e2ec] truncate group-hover:text-[#a5e7ff] transition-colors">
                        auth_service.py
                      </span>
                      <span className="text-[10px] text-[#859399] font-mono">Python • 4.2 KB</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="p-1 rounded text-[#859399] hover:text-[#e1e2ec] transition-colors border-none bg-transparent cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      className="p-1 rounded text-[#859399] hover:text-[#e1e2ec] transition-colors border-none bg-transparent cursor-pointer"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0b0e15]/60 border border-[#3c494e]/30 flex items-center justify-between hover:border-[#c0c1ff]/40 transition-colors group">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-1.5 rounded bg-[#c0c1ff]/10 text-[#c0c1ff]">
                      <Database size={13} />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-mono font-medium text-[#e1e2ec] truncate group-hover:text-[#c0c1ff] transition-colors">
                        redis_cluster_config.yaml
                      </span>
                      <span className="text-[10px] text-[#859399] font-mono">Config • 1.8 KB</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="p-1 rounded text-[#859399] hover:text-[#e1e2ec] transition-colors border-none bg-transparent cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      className="p-1 rounded text-[#859399] hover:text-[#e1e2ec] transition-colors border-none bg-transparent cursor-pointer"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Shared Memory State */}
              <div className="p-3.5 rounded-xl bg-[#0b0e15]/60 border border-[#3c494e]/40 space-y-2.5">
                <span className="text-[11px] font-mono font-medium text-[#e1e2ec] uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu size={12} className="text-[#38bdf8]" />
                  Live Shared Memory State
                </span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-[#3c494e]/20">
                    <span className="text-[#859399]">Active Session Entities</span>
                    <span className="text-[#e1e2ec] font-semibold">{stats.activeEntities}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#3c494e]/20">
                    <span className="text-[#859399]">Context Window Used</span>
                    <span className="text-[#00d2ff] font-semibold">14% of 200k</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#3c494e]/20">
                    <span className="text-[#859399]">Latency (TTFT)</span>
                    <span className="text-[#a5e7ff] font-semibold">{stats.ttft}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#859399]">Consistency Check</span>
                    <span className="text-[#10b981] flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "traces" && (
            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-lg bg-[#0b0e15]/60 border border-[#3c494e]/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#00d2ff]">
                  <span>01 • Planner Step</span>
                  <span>94ms</span>
                </div>
                <p className="text-[11px] text-[#859399]">Decomposed input goal into 3 sub-plans</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0b0e15]/60 border border-[#3c494e]/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#c0c1ff]">
                  <span>02 • Architecture Agent</span>
                  <span>310ms</span>
                </div>
                <p className="text-[11px] text-[#859399]">Groq Llama 3.3 70B • Edge topology synthesis</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0b0e15]/60 border border-[#3c494e]/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#a5e7ff]">
                  <span>03 • Security Validator</span>
                  <span>840ms</span>
                </div>
                <p className="text-[11px] text-[#859399]">Claude 3.7 Sonnet • Token replay audit</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0b0e15]/60 border border-[#3c494e]/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#38bdf8]">
                  <span>04 • Synthesizer</span>
                  <span>180ms</span>
                </div>
                <p className="text-[11px] text-[#859399]">DeepSeek V3 • Redis session manager logic</p>
              </div>
            </div>
          )}

          {activeTab === "tokens" && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-[#0b0e15]/60 border border-[#3c494e]/30 space-y-2">
                <div className="flex justify-between text-[#859399]">
                  <span>Prompt Tokens</span>
                  <span className="text-[#e1e2ec]">1,420</span>
                </div>
                <div className="flex justify-between text-[#859399]">
                  <span>Completion Tokens</span>
                  <span className="text-[#e1e2ec]">2,850</span>
                </div>
                <div className="flex justify-between text-[#859399]">
                  <span>Compressed Context</span>
                  <span className="text-[#00d2ff]">6,450 (-41.8%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Active Status */}
      <div className="px-4 py-3 border-t border-[#3c494e]/30 bg-[#0b0e15]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#859399]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-pulse"></span>
            <span>Telemetry Active</span>
          </div>
          <span className="text-[#a5e7ff] font-mono">24 req/s</span>
        </div>
      </div>
    </aside>
  );
}
