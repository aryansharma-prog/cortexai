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
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

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

  // User Message Card
  if (isUser) {
    return (
      <div className="max-w-4xl mx-auto w-full my-3 flex items-start gap-3.5 p-4 rounded-xl bg-[#191b23]/70 border border-[#3c494e]/30 shadow-sm backdrop-blur-sm transition-all">
        <div className="w-7 h-7 rounded-lg bg-[#272a32] border border-[#3c494e]/50 flex items-center justify-center shrink-0 font-mono text-xs font-semibold text-[#00d2ff] shadow-sm">
          AV
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#e1e2ec] tracking-tight">Operator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1d1f27] border border-[#3c494e]/30 text-[#859399]">
                User Prompt
              </span>
            </div>
            <button
              onClick={() => copyText(content, true)}
              className="text-[11px] font-mono text-[#859399] hover:text-[#e1e2ec] flex items-center gap-1 border-none bg-transparent cursor-pointer"
            >
              {copiedMessage ? <Check size={12} className="text-[#10b981]" /> : <Copy size={12} />}
              <span>{copiedMessage ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs sm:text-[13.5px] text-[#e1e2ec]/90 leading-relaxed font-normal whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant Response Card
  return (
    <div className="max-w-4xl mx-auto w-full space-y-3.5 my-4" onClick={handleBubbleClick}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#272a32] border border-[#00d2ff]/30 text-[#00d2ff] flex items-center justify-center shadow-sm">
            <Sparkles size={13} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#e1e2ec] tracking-tight">
              Cortex Consensus Cluster
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#272a32] text-[10px] font-mono text-[#00d2ff] border border-[#3c494e]/40">
              Consensus 3/3
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#859399]">
          Autonomous Dynamic Multi-Model
        </span>
      </div>

      {/* Main Glass Response Container */}
      <div className="rounded-xl bg-[#10131a]/80 border border-[#3c494e]/40 p-4 sm:p-5 space-y-4 backdrop-blur-md shadow-lg">
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
                className="w-36 h-28 sm:w-48 sm:h-36 max-w-full rounded-xl object-cover border border-[#3c494e]/50 cursor-zoom-in hover:opacity-95 hover:scale-[1.01] transition-all shadow-md"
              />
            ))}
          </div>
        )}

        {/* Markdown Content */}
        <div className="relative text-[#e1e2ec]/90 text-xs sm:text-[13.5px] leading-relaxed">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mt-4 mb-2 text-[#e1e2ec] border-b border-[#3c494e]/30 pb-1.5">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mt-3.5 mb-2 text-[#a5e7ff] flex items-center gap-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-3 mb-1.5 text-[#c0c1ff]">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-2.5 whitespace-pre-wrap break-words leading-relaxed text-[#e1e2ec]/90">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1.5 my-2.5 text-[#e1e2ec]/80">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 space-y-1.5 my-2.5 text-[#e1e2ec]/80">
                  {children}
                </ol>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-3.5 rounded-xl border border-[#3c494e]/40 bg-[#0b0e15]/80 shadow-md">
                  <table className="min-w-full divide-y divide-[#3c494e]/30 text-xs">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-[#191b23] border-b border-[#3c494e]/30">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-3.5 py-2 text-left text-[11px] font-mono font-semibold text-[#00d2ff] uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-t border-[#3c494e]/20 px-3.5 py-2 text-xs text-[#e1e2ec]/80 leading-normal">
                  {children}
                </td>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#00d2ff] hover:text-[#47d6ff] underline font-medium inline-flex items-center gap-1 transition-colors"
                >
                  {children}
                  <ExternalLink size={12} />
                </a>
              ),
              code: ({ className, children }) => {
                const value = String(children).trim();

                if (!className) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-[#1d1f27] font-mono text-xs text-[#00d2ff] border border-[#3c494e]/30">
                      {value}
                    </code>
                  );
                }

                const language = className.replace("language-", "");

                return (
                  <div className="my-3 overflow-hidden rounded-lg border border-[#3c494e]/40 bg-[#0b0e15] shadow-lg">
                    <div className="flex items-center justify-between bg-[#191b23] border-b border-[#3c494e]/30 px-3.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#32353d]" />
                        <span className="w-2 h-2 rounded-full bg-[#32353d]" />
                        <span className="w-2 h-2 rounded-full bg-[#32353d]" />
                        <span className="uppercase text-[10px] font-mono tracking-wider text-[#859399] ml-1">
                          {language}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[11px] font-mono text-[#859399] hover:text-[#00d2ff] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer border-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(value, false);
                        }}
                      >
                        {copiedCode === value ? (
                          <>
                            <Check size={12} className="text-[#10b981]" />
                            <span className="text-[#10b981]">Copied</span>
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
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: "1rem",
                        background: "#0b0e15",
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
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#3c494e]/30">
          <button
            onClick={() => copyText(content, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d1f27] hover:bg-[#272a32] border border-[#3c494e]/40 text-xs font-mono font-medium text-[#e1e2ec] transition-colors cursor-pointer"
          >
            {copiedMessage ? <Check size={12} className="text-[#10b981]" /> : <Copy size={12} className="text-[#00d2ff]" />}
            <span>{copiedMessage ? "Copied" : "Copy Solution"}</span>
          </button>

          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d1f27] hover:bg-[#272a32] border border-[#3c494e]/40 text-xs font-mono font-medium text-[#e1e2ec] transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className="text-[#c0c1ff]" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d1f27] hover:bg-[#272a32] border border-[#3c494e]/40 text-xs font-mono font-medium text-[#e1e2ec] transition-colors cursor-pointer"
          >
            <Download size={12} className="text-[#38bdf8]" />
            <span>Export Spec</span>
          </button>

          <button
            onClick={() => {
              const traceStr = JSON.stringify(workflow || { executionId, metrics }, null, 2);
              navigator.clipboard?.writeText(traceStr);
              alert("Execution trace copied to clipboard as JSON!");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d1f27] hover:bg-[#272a32] border border-[#3c494e]/40 text-xs font-mono font-medium text-[#859399] hover:text-[#e1e2ec] transition-colors ml-auto cursor-pointer"
          >
            <Code2 size={12} className="text-[#00d2ff]" />
            <span>Trace JSON</span>
          </button>
        </div>

        {/* Collapsible Autonomous Execution Graph Accordion */}
        <div className="pt-2 border-t border-[#3c494e]/30">
          <details
            open={showExecutionGraph}
            onToggle={(e) => setShowExecutionGraph(e.target.open)}
            className="group rounded-lg border border-[#3c494e]/40 bg-[#0b0e15]/70 backdrop-blur-md transition-all overflow-hidden"
          >
            <summary className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-[#191b23]/50 transition-colors list-none">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-[#00d2ff]/10 text-[#00d2ff]">
                  <Activity size={13} />
                </div>
                <span className="text-xs font-semibold text-[#e1e2ec] tracking-tight">
                  Autonomous Execution Graph
                </span>
                <span className="text-[10px] font-mono text-[#859399]">(4 Agents)</span>
                <span className="px-2 py-0.5 rounded-full bg-[#1d1f27] text-[#00d2ff] text-[10px] font-mono border border-[#00d2ff]/20 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#00d2ff]" />
                  Completed in 1.42s
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#859399] group-hover:text-[#e1e2ec] text-[11px] font-mono transition-colors">
                <span>Inspect Agent Pipeline</span>
                <ChevronDown size={14} className="transition-transform duration-200 group-open:rotate-180" />
              </div>
            </summary>

            <div className="px-3.5 pb-3.5 pt-1.5 border-t border-[#3c494e]/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1.5">
                {/* Step 1 */}
                <div className="p-2.5 rounded-lg bg-[#191b23]/50 border border-[#3c494e]/30 hover:border-[#00d2ff]/40 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#00d2ff]">01 • Planner</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e1e2ec] truncate">Orchestrator Agent</p>
                    <p className="text-[10px] text-[#859399] truncate">Task decomposed in 3 plans</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#859399] border-t border-[#3c494e]/20 pt-1">
                    <span>94ms</span>
                    <span className="text-[#00d2ff]">100% match</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-2.5 rounded-lg bg-[#191b23]/50 border border-[#3c494e]/30 hover:border-[#c0c1ff]/40 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#c0c1ff]">02 • Topology</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff] shadow-[0_0_8px_#c0c1ff]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e1e2ec] truncate">Groq Llama 3.3 70B</p>
                    <p className="text-[10px] text-[#859399] truncate">Edge routing topology</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#859399] border-t border-[#3c494e]/20 pt-1">
                    <span>310ms</span>
                    <span className="text-[#c0c1ff]">480 tok/s</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-2.5 rounded-lg bg-[#191b23]/50 border border-[#3c494e]/30 hover:border-[#a5e7ff]/40 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#a5e7ff]">03 • Security</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a5e7ff] shadow-[0_0_8px_#a5e7ff]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e1e2ec] truncate">Claude 3.7 Sonnet</p>
                    <p className="text-[10px] text-[#859399] truncate">Revocation & replay check</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#859399] border-t border-[#3c494e]/20 pt-1">
                    <span>840ms</span>
                    <span className="text-[#a5e7ff]">Zero Vuln</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-2.5 rounded-lg bg-[#191b23]/50 border border-[#3c494e]/30 hover:border-[#38bdf8]/40 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#38bdf8]">04 • Synthesizer</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#e1e2ec] truncate">DeepSeek V3</p>
                    <p className="text-[10px] text-[#859399] truncate">Redis wrapper authored</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#859399] border-t border-[#3c494e]/20 pt-1">
                    <span>180ms</span>
                    <span className="text-[#38bdf8]">98.6% valid</span>
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
