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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-5xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#faf8f5]">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[11px] font-mono mb-2 font-medium">
            <FileCode size={11} className="text-orange-600" />
            <span>Artifacts & Document Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Knowledge & Artifacts
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-600 mt-1 leading-relaxed">
            Review and download generated executive reports, code artifacts, slide decks, and data sheets.
          </p>
        </div>
      </div>

      {/* Artifacts List */}
      <div className="my-6 space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold px-1">
          Generated Documents & Code
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-stone-200 bg-white shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                    {item.type}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 font-medium">{item.size}</span>
                </div>
                <div className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug">
                  {item.title}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
                <span className="truncate max-w-[150px]">{item.filename}</span>
                <span className="text-orange-600 font-bold">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
