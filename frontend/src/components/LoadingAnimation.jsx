import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { Sparkles, Brain, Search, Layers, Square, Loader2 } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { cancelExecutionRequest } from '../features/sendMessage'
import { addMessage, clearLiveExecution, setIsLoading, setIsStopping } from '../redux/messageSlice'

function LoadingAnimation({ currentActivity = null }) {
    const dispatch = useDispatch()
    const { isStopping, currentExecutionId } = useSelector(state => state.message)

    const STEPS = [
        { label: "Analyzing Task & Planning Strategy", icon: Brain, detail: "Decomposing query with Adaptive Orchestrator" },
        { label: "Retrieving Domain & Factual Context", icon: Search, detail: "Querying specialized agents and live knowledge" },
        { label: "Executing Multi-Agent Workflow", icon: Layers, detail: "Running reasoning and domain models in parallel" },
        { label: "Synthesizing Executive Output", icon: Sparkles, detail: "Formatting structured tables, metrics & assets" }
    ]

    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev))
        }, 2400)
        return () => clearInterval(interval)
    }, [])

    const handleStopClick = async () => {
        if (isStopping) return;
        dispatch(setIsStopping(true));

        if (currentExecutionId) {
            await cancelExecutionRequest(currentExecutionId);
        }

        dispatch(setIsLoading(false));
        dispatch(setIsStopping(false));
        dispatch(clearLiveExecution());

        dispatch(addMessage({
            role: "assistant",
            content: "⏹️ **Research stopped by user.**\n\nYou can refine your query or start a new research request below."
        }));
    };

    const activeStepData = STEPS[currentStep]

    return (
        <div className='flex flex-col gap-2.5 max-w-[92vw] sm:max-w-[85%] md:max-w-[70%] py-2'>
            <div className='flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-[#13151f]/90 border border-white/[0.08] shadow-lg'>
                <div className='flex items-center gap-3 min-w-0 flex-1'>
                    <div className='relative w-7 h-7 flex items-center justify-center shrink-0'>
                        {[0, 0.4, 0.8].map((delay, i) => (
                            <motion.div
                                key={i}
                                className="absolute inset-0 rounded-full border border-indigo-400/40"
                                initial={{ scale: 0.3, opacity: 0.6 }}
                                animate={{ scale: 1.8, opacity: 0 }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    delay,
                                    ease: "easeOut",
                                }}
                            />
                        ))}

                        <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shadow-[0_0_12px_rgba(99,102,241,0.7)]"
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    <div className='flex flex-col min-w-0 flex-1 overflow-hidden'>
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={currentActivity || activeStepData.label}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-[13px] font-semibold text-slate-100 tracking-tight truncate">
                                    {currentActivity || activeStepData.label}
                                </span>
                                <motion.span
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    className="text-indigo-400 font-bold text-xs"
                                >
                                    •••
                                </motion.span>
                            </motion.div>
                        </AnimatePresence>
                        <p className='text-[11px] text-slate-400 truncate mt-0.5'>
                            {activeStepData.detail}
                        </p>
                    </div>
                </div>

                {/* Inline Stop Button */}
                <button
                    onClick={handleStopClick}
                    disabled={isStopping}
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold shrink-0 cursor-pointer transition-all shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                >
                    {isStopping ? (
                        <>
                            <Loader2 size={12} className='animate-spin' />
                            <span>Stopping...</span>
                        </>
                    ) : (
                        <>
                            <Square size={12} className='fill-current' />
                            <span>Stop</span>
                        </>
                    )}
                </button>
            </div>

            {/* Stepper Dots */}
            <div className='flex items-center gap-1.5 px-3'>
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                        <div
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-500 ${
                                isCompleted
                                    ? "w-8 bg-indigo-500"
                                    : isCurrent
                                    ? "w-12 bg-gradient-to-r from-indigo-400 to-violet-500 animate-pulse"
                                    : "w-4 bg-white/10"
                            }`}
                        />
                    );
                })}
            </div>
        </div>
    )
}

export default LoadingAnimation
