import { Activity, Check, ChevronDown, ChevronUp, Copy, ExternalLink, Sparkles, X } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import AgentActivityPanel from './AgentActivityPanel';

function MessageBubble({
  role,
  content = "",
  images = [],
  workflow = null,
  metrics = null,
  executionId = null,
  isLatest = false,
  createdAt = null
}) {
  const isUser = role === "user"
  const [lightBox, setLightBox] = useState(null)
  const [copiedCode, setCopiedCode] = useState("")
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  // Progressive streaming / typewriter state for newly arrived assistant message
  const [displayedContent, setDisplayedContent] = useState(isUser || !isLatest ? content : "")
  const [isTyping, setIsTyping] = useState(isLatest && !isUser && content?.length > 0)
  const typingTimerRef = useRef(null)

  useEffect(() => {
    if (isUser || !isLatest || !content) {
      setDisplayedContent(content)
      setIsTyping(false)
      return
    }

    // Start progressive typing reveal
    let currentIndex = 0
    const totalLength = content.length
    // Adaptive chunking: short messages type word-by-word, longer messages stream faster
    const chunkSize = totalLength > 1200 ? 12 : totalLength > 600 ? 6 : 3
    const intervalMs = totalLength > 1200 ? 12 : 16

    setIsTyping(true)

    typingTimerRef.current = setInterval(() => {
      currentIndex += chunkSize
      if (currentIndex >= totalLength) {
        setDisplayedContent(content)
        setIsTyping(false)
        clearInterval(typingTimerRef.current)
      } else {
        setDisplayedContent(content.slice(0, currentIndex))
      }
    }, intervalMs)

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current)
      }
    }
  }, [content, isLatest, isUser])

  // Click to reveal entire text immediately if typing
  const handleBubbleClick = () => {
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current)
      setDisplayedContent(content)
      setIsTyping(false)
    }
  }

  const copyText = async (text, isFullMessage = false) => {
    try {
      if (!text) return
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      if (isFullMessage) {
        setCopiedMessage(true)
        setTimeout(() => setCopiedMessage(false), 2000)
      } else {
        setCopiedCode(text)
        setTimeout(() => setCopiedCode(""), 2000)
      }
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const hasActivityData = Boolean(workflow || metrics || (workflow?.subtasks && workflow.subtasks.length > 0))
  const totalAgents = metrics?.totalAgents || (workflow?.subtasks ? workflow.subtasks.length : 1)
  const totalTokens = metrics?.totalTokens ? `${Number(metrics.totalTokens).toLocaleString()} tokens` : ""
  const duration = metrics?.totalDurationMs ? `${(metrics.totalDurationMs / 1000).toFixed(1)}s` : ""

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} group relative mb-3`}>
      <div
        onClick={handleBubbleClick}
        className={`w-fit max-w-[92vw] sm:max-w-[85%] md:max-w-[75%]
  px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl
  break-words overflow-hidden
  leading-relaxed relative transition-all duration-150
        ${isUser
          ? "bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white rounded-tr-sm shadow-md"
          : "bg-[#14161f]/95 border border-white/[0.08] text-slate-200 rounded-tl-sm shadow-sm"
        }`}>

        {/* User Message Header with Copy Button */}
        {isUser && (
          <div className='flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10'>
            <span className='text-[10px] uppercase font-semibold tracking-wider text-indigo-200/80'>You</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyText(content || "", true);
              }}
              className='inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-indigo-100 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer'
              title="Copy message"
            >
              {copiedMessage ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
              <span>{copiedMessage ? "Copied" : "Copy"}</span>
            </button>
          </div>
        )}

        {/* Generated or Attached Images */}
        {images.length > 0 && (
          <div className='flex flex-wrap gap-2.5 my-3'>
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
                className="w-36 h-28 sm:w-48 sm:h-36 max-w-full rounded-xl object-cover border border-white/15 cursor-zoom-in hover:opacity-95 hover:scale-[1.01] transition-all shadow-lg"
              />
            ))}
          </div>
        )}

        {/* Markdown Content with Typing Cursor */}
        <div className="relative">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className='text-2xl font-bold mt-4 mb-2 text-white border-b border-white/10 pb-1.5'>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className='text-xl font-semibold mt-3.5 mb-2 text-indigo-100 flex items-center gap-2'>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className='text-lg font-semibold mt-3 mb-1.5 text-indigo-200'>{children}</h3>
              ),
              p: ({ children }) => (
                <p className='mb-2.5 whitespace-pre-wrap break-words leading-relaxed text-[13.5px] text-slate-200'>{children}</p>
              ),
              ul: ({ children }) => (
                <ul className='list-disc pl-5 space-y-1.5 my-2.5 text-[13.5px] text-slate-300'>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className='list-decimal pl-5 space-y-1.5 my-2.5 text-[13.5px] text-slate-300'>{children}</ol>
              ),
              table: ({ children }) => (
                <div className='overflow-x-auto my-3.5 rounded-xl border border-white/[0.12] bg-[#0b0d14]/70 shadow-md'>
                  <table className='min-w-full divide-y divide-white/10 text-[13px]'>
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className='bg-indigo-950/40 border-b border-white/10'>
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className='px-3.5 py-2.5 text-left text-[12px] font-semibold text-indigo-200 uppercase tracking-wider'>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className='border-t border-white/[0.06] px-3.5 py-2 text-[12.5px] text-slate-300 leading-normal'>
                  {children}
                </td>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-1 transition-colors"
                >
                  {children}
                  <ExternalLink size={13} />
                </a>
              ),
              code: ({ className, children }) => {
                const value = String(children).trim()

                if (!className) {
                  return (
                    <code className='px-1.5 py-0.5 rounded bg-white/10 font-mono text-[12.5px] text-indigo-200'>
                      {value}
                    </code>
                  )
                }

                const language = className.replace("language-", "")

                return (
                  <div className='my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0e1017] shadow-lg'>
                    <div className='flex items-center justify-between bg-[#151821] border-b border-white/10 px-3.5 py-1.5'>
                      <span className='uppercase text-[11px] font-mono tracking-wider text-slate-400'>
                        {language}
                      </span>
                      <button
                        type="button"
                        className='flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-all cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(value, false);
                        }}
                      >
                        {copiedCode === value ? (
                          <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <SyntaxHighlighter
                      language={language}
                      style={oneDark}
                      wrapLongLines
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        padding: "14px",
                        background: "#0a0c12",
                        fontSize: "12.5px",
                      }}
                    >
                      {value}
                    </SyntaxHighlighter>
                  </div>
                )
              },
              img: ({ src, alt }) => {
                if (!src) return null;
                return (
                  <div className='my-3'>
                    <img
                      src={src}
                      alt={alt || "Image"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightBox(src);
                      }}
                      loading="lazy"
                      onError={(e) => e.currentTarget.remove()}
                      className="max-h-80 w-auto rounded-xl object-contain border border-white/15 cursor-zoom-in hover:opacity-95 transition-all shadow-md bg-black/20"
                    />
                  </div>
                )
              }
            }}
          >
            {displayedContent}
          </Markdown>

          {/* Glowing Typing Cursor */}
          {isTyping && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          )}
        </div>

        {/* Assistant Footer Actions: Copy Full Response + Agent Activity */}
        {!isUser && !isTyping && (
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyText(content || "", true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all cursor-pointer"
              title="Copy full response"
            >
              {copiedMessage ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedMessage ? "Copied" : "Copy response"}</span>
            </button>

            {hasActivityData && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActivity(!showActivity);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/[0.06] transition-all cursor-pointer"
              >
                <Activity size={12} className="text-indigo-400" />
                <span>Agent Activity</span>
                <span className="hidden sm:inline text-[10.5px] text-slate-400 font-mono">
                  ({totalAgents} agent{totalAgents > 1 ? "s" : ""}{totalTokens ? ` · ${totalTokens}` : ""}{duration ? ` · ${duration}` : ""})
                </span>
                <span className="sm:hidden text-[10.5px] text-slate-400 font-mono">
                  ({totalAgents} ag)
                </span>
                {showActivity ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
              </button>
            )}
          </div>
        )}

      </div>

      {/* Expandable Agent Activity Panel */}
      {!isUser && hasActivityData && showActivity && (
        <div className="w-full max-w-[92vw] sm:max-w-[85%] md:max-w-[75%] mt-2">
          <AgentActivityPanel workflow={workflow} executionTree={workflow?.executionTree} metrics={metrics} />
        </div>
      )}

      {/* Fullscreen LightBox */}
      {lightBox && (
        <div className='fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6'>
          <button
            className='absolute top-4 right-4 sm:top-5 sm:right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-2.5 transition cursor-pointer'
            onClick={() => setLightBox(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightBox}
            className="max-w-[95vw] max-h-[85vh] rounded-2xl border border-white/15 shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  )
}

export default MessageBubble
