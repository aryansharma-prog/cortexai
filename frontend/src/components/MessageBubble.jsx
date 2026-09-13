import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Sparkles,
  X,
  Network,
  RotateCcw,
  Download,
  Code2,
  Share2,
  CheckCircle2,
  Layers,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MessageBubble({
  role,
  content = "",
  images = [],
  workflow = null,
  metrics = null,
  executionId = null,
  isLatest = false,
  createdAt = null
}) {
  const isUser = role === "user";
  const [lightBox, setLightBox] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showExecutionGraph, setShowExecutionGraph] = useState(false);

  // Progressive streaming / typewriter state for newly arrived assistant message
  const [displayedContent, setDisplayedContent] = useState(isUser || !isLatest ? content : "");
  const [isTyping, setIsTyping] = useState(isLatest && !isUser && content?.length > 0);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (isUser || !isLatest || !content) {
      setDisplayedContent(content);
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    const totalLength = content.length;
    const chunkSize = totalLength > 1200 ? 12 : totalLength > 600 ? 6 : 3;
    const intervalMs = totalLength > 1200 ? 12 : 16;

    setIsTyping(true);

    typingTimerRef.current = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= totalLength) {
        setDisplayedContent(content);
        setIsTyping(false);
        clearInterval(typingTimerRef.current);
      } else {
        setDisplayedContent(content.slice(0, currentIndex));
      }
    }, intervalMs);

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, [content, isLatest, isUser]);

  const handleBubbleClick = () => {
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedContent(content);
      setIsTyping(false);
    }
  };

  const copyText = async (text, isFullMessage = false) => {
    try {
      if (!text) return;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      if (isFullMessage) {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      } else {
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(""), 2000);
      }
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // User Message Card (Clean White with Saffron Avatar)
  if (isUser) {
    return (
      <div className="max-w-5xl mx-auto w-full my-3 flex items-start gap-3.5 p-4 rounded-xl bg-white border border-stone-200/90 shadow-xs transition-all">
        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 font-mono text-xs font-semibold text-orange-600 shadow-2xs">
          AV
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 tracking-tight">Alex V.</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 border border-stone-200 text-slate-600">
                Operator
              </span>
            </div>
            <button
              onClick={() => copyText(content, true)}
              className="text-[11px] font-mono text-slate-400 hover:text-orange-600 flex items-center gap-1 border-none bg-transparent cursor-pointer"
            >
              {copiedMessage ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedMessage ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs sm:text-[13.5px] text-slate-800 leading-relaxed font-normal whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant Response Card (Clean White & Saffron Accent)
  return (
    <div className="max-w-5xl mx-auto w-full space-y-3.5 my-4" onClick={handleBubbleClick}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shadow-2xs">
            <Sparkles size={13} />
          </div>
          <span className="text-xs font-semibold text-slate-900 tracking-tight">
            Cortex Consensus Cluster
          </span>
        </div>
      </div>

      {/* Main Glass Response Container */}
      <div className="rounded-xl bg-white border border-stone-200/90 shadow-sm p-4 sm:p-5 space-y-4">
        {/* Attached or Generated Images */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2.5 my-2">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightBox(img);
                }}
                loading="lazy"
                onError={(e) => e.currentTarget.remove()}
                className="w-36 h-28 sm:w-48 sm:h-36 max-w-full rounded-xl object-cover border border-stone-200 cursor-zoom-in hover:opacity-95 hover:scale-[1.01] transition-all shadow-md"
              />
            ))}
          </div>
        )}

        {/* Markdown Content */}
        <div className="relative text-slate-800 text-xs sm:text-[13.5px] leading-relaxed">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900 border-b border-stone-200 pb-1.5">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mt-3.5 mb-2 text-orange-600 flex items-center gap-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-3 mb-1.5 text-amber-700">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-2.5 whitespace-pre-wrap break-words leading-relaxed text-slate-800">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1.5 my-2.5 text-slate-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 space-y-1.5 my-2.5 text-slate-700">
                  {children}
                </ol>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-3.5 rounded-xl border border-stone-200 bg-stone-50/70 shadow-xs">
                  <table className="min-w-full divide-y divide-stone-200 text-xs">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-stone-100 border-b border-stone-200">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-3.5 py-2 text-left text-[11px] font-mono font-semibold text-orange-700 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-t border-stone-200 px-3.5 py-2 text-xs text-slate-700 leading-normal">
                  {children}
                </td>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-orange-600 hover:text-orange-700 underline font-medium inline-flex items-center gap-1 transition-colors"
                >
                  {children}
                  <ExternalLink size={12} />
                </a>
              ),
              code: ({ className, children }) => {
                const value = String(children).trim();

                if (!className) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-orange-50 font-mono text-xs text-orange-600 border border-orange-200 font-semibold">
                      {value}
                    </code>
                  );
                }

                const language = className.replace("language-", "");

                return (
                  <div className="my-3 overflow-hidden rounded-lg border border-stone-200 bg-stone-50/60 shadow-xs">
                    <div className="flex items-center justify-between bg-stone-100/90 border-b border-stone-200 px-3.5 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="uppercase text-[10px] font-mono font-semibold tracking-wider text-slate-700 ml-1">
                          {language}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-orange-600 px-2 py-0.5 rounded bg-white hover:bg-orange-50 transition-all cursor-pointer border border-stone-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(value, false);
                        }}
                      >
                        {copiedCode === value ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={language}
                      style={oneLight}
                      customStyle={{
                        margin: 0,
                        padding: "1rem",
                        background: "#ffffff",
                        fontSize: "12px",
                        lineHeight: "1.5"
                      }}
                    >
                      {value}
                    </SyntaxHighlighter>
                  </div>
                );
              }
            }}
          >
            {displayedContent}
          </Markdown>
        </div>

        {/* Interactive Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200">
          <button
            onClick={() => copyText(content, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-orange-50/60 border border-stone-200 hover:border-orange-200 text-xs font-mono font-medium text-slate-700 hover:text-orange-600 transition-colors cursor-pointer"
          >
            {copiedMessage ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-orange-600" />}
            <span>{copiedMessage ? "Copied" : "Copy Solution"}</span>
          </button>

          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-orange-50/60 border border-stone-200 hover:border-orange-200 text-xs font-mono font-medium text-slate-700 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className="text-amber-600" />
            <span>Rerun Claude 3.7</span>
          </button>

          <button
            onClick={() => {
              const blob = new Blob([content], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cortex_spec_${Date.now()}.md`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-orange-50/60 border border-stone-200 hover:border-orange-200 text-xs font-mono font-medium text-slate-700 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <Download size={12} className="text-emerald-600" />
            <span>Export to GitHub</span>
          </button>

          <button
            onClick={() => {
              const traceStr = JSON.stringify(workflow || { executionId, metrics }, null, 2);
              navigator.clipboard?.writeText(traceStr);
              alert("Execution trace copied to clipboard as JSON!");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-orange-50/60 border border-stone-200 hover:border-orange-200 text-xs font-mono font-medium text-slate-500 hover:text-orange-600 transition-colors ml-auto cursor-pointer"
          >
            <Code2 size={12} className="text-orange-600" />
            <span>Trace JSON</span>
          </button>
        </div>

        {/* Collapsible Autonomous Execution Graph Accordion */}
        <div className="pt-2 border-t border-stone-200">
          <details
            open={showExecutionGraph}
            onToggle={(e) => setShowExecutionGraph(e.target.open)}
            className="group rounded-lg border border-amber-200/80 bg-white transition-all overflow-hidden shadow-xs"
          >
            <summary className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-orange-50/30 transition-colors list-none">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-orange-100 text-orange-600">
                  <Activity size={13} />
                </div>
                <span className="text-xs font-semibold text-slate-900 tracking-tight">
                  Autonomous Execution Graph
                </span>
                <span className="text-[10px] font-mono text-slate-500">(4 Agents)</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-mono font-semibold border border-orange-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  Completed in 1.42s
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-orange-600 text-[11px] font-mono font-medium transition-colors">
                <span>Inspect Agent Pipeline</span>
                <ChevronDown size={14} className="transition-transform duration-200 group-open:rotate-180" />
              </div>
            </summary>

            <div className="px-3.5 pb-3.5 pt-1.5 border-t border-stone-200/70 bg-stone-50/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1.5">
                {/* Step 1 */}
                <div className="p-2.5 rounded-lg bg-white border border-orange-200 hover:border-orange-500 shadow-xs transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-orange-600">01 • Planner</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate">Orchestrator Agent</p>
                    <p className="text-[10px] text-slate-500 truncate">Task decomposed in 3 plans</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-stone-100 pt-1">
                    <span>94ms</span>
                    <span className="text-orange-600 font-semibold">100% match</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-2.5 rounded-lg bg-white border border-amber-200 hover:border-amber-500 shadow-xs transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-amber-600">02 • Topology</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate">Groq Llama 3.3 70B</p>
                    <p className="text-[10px] text-slate-500 truncate">Edge routing topology</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-stone-100 pt-1">
                    <span>310ms</span>
                    <span className="text-amber-600 font-semibold">480 tok/s</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-2.5 rounded-lg bg-white border border-orange-200 hover:border-orange-500 shadow-xs transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-orange-600">03 • Security</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shadow-[0_0_6px_rgba(234,88,12,0.8)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate">Claude 3.7 Sonnet</p>
                    <p className="text-[10px] text-slate-500 truncate">Revocation & replay check</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-stone-100 pt-1">
                    <span>840ms</span>
                    <span className="text-orange-600 font-semibold">Zero Vuln</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-500 shadow-xs transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-emerald-700">04 • Synthesizer</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate">DeepSeek V3</p>
                    <p className="text-[10px] text-slate-500 truncate">Redis wrapper authored</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-stone-100 pt-1">
                    <span>180ms</span>
                    <span className="text-emerald-700 font-semibold">98.6% valid</span>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
