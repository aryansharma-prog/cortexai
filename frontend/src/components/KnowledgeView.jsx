import React, { useState } from "react";
import {
  FileText,
  Code2,
  Presentation,
  Download,
  Search,
  ExternalLink,
  Sparkles,
  FileCode,
  FolderOpen
} from "lucide-react";
import { useSelector } from "react-redux";

export default function KnowledgeView() {
  const { artifacts } = useSelector((state) => state.message);
  const [search, setSearch] = useState("");

  const sampleItems = [
    {
      id: 1,
      type: "PDF Report",
      title: "Automated Architecture & Model Routing Specification",
      filename: "cortex_spec.pdf",
      date: "Recent",
      size: "240 KB"
    },
    {
      id: 2,
      type: "Source Code",
      title: "Shared Incremental Memory & Response Policy Engine",
      filename: "sharedMemory.js",
      date: "Recent",
      size: "18 KB"
    },
    {
      id: 3,
      type: "Presentation",
      title: "CortexAI Dynamic Multi-Agent Benchmarks Deck",
      filename: "cortex_benchmarks.pptx",
      date: "Recent",
      size: "1.2 MB"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-5xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono mb-2">
            <FileCode size={11} />
            <span>Artifacts & Document Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-100 tracking-tight">
            KNOWLEDGE & ARTIFACTS
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-1 leading-relaxed">
            Review and download generated executive reports, code artifacts, slide decks, and data sheets.
          </p>
        </div>
      </div>

      {/* Artifacts List */}
      <div className="my-6 space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
          Generated Documents & Code
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sampleItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0e14] hover:border-white/[0.14] hover:bg-white/[0.02] transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {item.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{item.size}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-2">
                  {item.title}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px] text-slate-400 font-mono">
                <span>{item.filename}</span>
                <span className="text-blue-400 font-medium">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
