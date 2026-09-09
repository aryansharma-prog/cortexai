import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import MessageBubble from './MessageBubble'
import LoadingAnimation from './LoadingAnimation'

function MessageList() {
    const { selectedConversation } = useSelector(state => state.conversation)
    const { messages, isLoading } = useSelector(state => state.message)
    const bottomRef = useRef(null)

    useEffect(() => {
        requestAnimationFrame(() => {
            bottomRef?.current?.scrollIntoView({
                behavior: "smooth",
                block: "end"
            })
        })
    }, [messages?.length, isLoading])

    return (
        <div className='flex-1 overflow-y-auto px-4 md:px-7 py-6 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {messages.length === 0 || !selectedConversation ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                    <div className='flex flex-col gap-1.5'>
                        <h1 className='text-[22px] font-semibold text-slate-100 tracking-tight'>CortexAI</h1>
                        <p className='text-[15px] font-medium text-slate-400 tracking-tight'>Adaptive Multi-Agent AI Platform</p>
                        <p className='text-[13px] text-slate-500 max-w-[340px] leading-relaxed'>
                            Intelligently analyzes tasks, orchestrates specialized agents, and generates structured executive reports.
                        </p>
                    </div>
                    <div className='flex flex-wrap justify-center gap-2 mt-2 max-w-[540px]'>
                        {[
                            "Top AKTU colleges in Noida and Ghaziabad placement statistics",
                            "Compare Tesla and BYD financially and prepare a report",
                            "Explain binary search algorithm with diagrams",
                            "Generate a PowerPoint deck on AI trends in 2026"
                        ].map((s) => (
                            <button
                                key={s}
                                className='text-[12px] text-slate-400 bg-white/[0.04] border border-white/[0.07] px-3.5 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-slate-200 transition-colors duration-150 cursor-pointer'
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className='space-y-4'>
                    {messages?.map((msg, i) => (
                        <div key={msg._id || msg.id || i}>
                            <MessageBubble
                                role={msg?.role}
                                content={msg?.content}
                                images={msg.images || []}
                                workflow={msg.workflow}
                                metrics={msg.metrics}
                                executionId={msg.executionId}
                                isLatest={i === messages.length - 1 && msg.role === 'assistant'}
                                createdAt={msg.createdAt}
                            />
                        </div>
                    ))}

                    {isLoading && <LoadingAnimation />}
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    )
}

export default MessageList
