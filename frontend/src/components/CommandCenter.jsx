import React, { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Zap,
  ArrowRight,
  ShieldCheck,
  Paperclip,
  Mic,
  MicOff,
  Send,
  Square,
  Loader2,
  X,
  FileText,
  Sparkles,
  Layers,
  CheckCircle2,
  Info
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  setArtifacts,
  setIsLoading,
  setIsStopping,
  setCurrentExecutionId,
  clearLiveExecution,
  setMessages
} from "../redux/messageSlice";
import { createConversation } from "../features/createConversation";
import { addConversation, setConvTitle, setSelectedConversation } from "../redux/conversationSlice";
import { updateConversation } from "../features/updateConversation";
import sendMessage, { cancelExecutionRequest } from "../features/sendMessage";
import MessageList from "./MessageList";
import Nav from "./Nav";
import TokenEfficiencyWidget from "./TokenEfficiencyWidget";
import CortexContinuitySection from "./CortexContinuitySection";

export default function CommandCenter({ onViewInsights }) {
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileRef = useRef(null);
  const abortControllerRef = useRef(null);

  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages, isLoading, isStopping, currentExecutionId } = useSelector(
    (state) => state.message
  );
  const dispatch = useDispatch();

  // Voice recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        transcript += event.results[index][0].transcript;
      }
      setPrompt(transcript);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleStopExecution = async () => {
    if (isStopping) return;
    dispatch(setIsStopping(true));

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (currentExecutionId) {
      await cancelExecutionRequest(currentExecutionId);
    }

    dispatch(setIsLoading(false));
    dispatch(setIsStopping(false));
    dispatch(clearLiveExecution());

    dispatch(
      addMessage({
        role: "assistant",
        content: "⏹️ **Task execution stopped by user.**\n\nTask state preserved in Shared Notebook."
      })
    );
  };

  const handleRunTask = async (promptOverride = null) => {
    const userPrompt = typeof promptOverride === "string" ? promptOverride.trim() : prompt.trim();
    const fileToSend = selectedFile;

    if (!userPrompt && !fileToSend) return;
    if (isLoading) return;

    // Reset input state
    setPrompt("");
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    dispatch(setCurrentExecutionId(executionId));
    dispatch(setIsLoading(true));
    dispatch(setIsStopping(false));
    dispatch(clearLiveExecution());
    dispatch(addMessage({ role: "user", content: userPrompt }));

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    let conversation = selectedConversation;
    if (!conversation || !conversation._id) {
      const conv = await createConversation();
      if (conv && conv._id) {
        conversation = conv;
        dispatch(addConversation(conv));
        dispatch(setSelectedConversation(conv));
      }
    }

    if (conversation && conversation._id && conversation.title === "New Chat") {
      const newTitle = userPrompt.slice(0, 40);
      updateConversation({ id: conversation._id, title: newTitle }).catch(console.error);
      dispatch(setConvTitle({ conversationId: conversation._id, title: newTitle }));
    }

    const formData = new FormData();
    formData.append("prompt", userPrompt);
    if (conversation?._id) {
      formData.append("conversationId", conversation._id);
    }
    formData.append("agent", "auto"); // Autonomous routing
    formData.append("executionId", executionId);
    if (fileToSend) {
      formData.append("file", fileToSend);
    }

    const data = await sendMessage(formData, signal);

    if (signal.aborted) return;

    dispatch(setIsLoading(false));
    dispatch(clearLiveExecution());

    if (data?.status === "cancelled" || data?.isCancelled) {
      dispatch(
        addMessage({
          role: "assistant",
          content: "⏹️ **Task execution stopped by user.**"
        })
      );
    } else if (data?.answer) {
      dispatch(setArtifacts(data.artifacts || []));
      dispatch(
        addMessage({
          role: "assistant",
          content: data.answer,
          images: data?.images || [],
          workflow: data?.workflow || null,
          metrics: data?.metrics || null,
          executionId: data?.executionId || executionId
        })
      );
    } else {
      dispatch(
        addMessage({
          role: "assistant",
          content: data?.error
            ? `⚠️ ${data.error}`
            : "Sorry, I encountered an issue processing your request. Please try again."
        })
      );
    }
  };

  const samplePrompts = [
    "Compare Tesla and BYD market share, margins, and autonomous driving roadmap",
    "Design a scalable distributed authentication architecture with JWT and Redis",
    "Analyze Q3 tech earnings trends and generate an executive summary table",
    "Explain Raft consensus algorithm step-by-step with state transitions"
  ];

  const hasMessages = messages && messages.length > 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#090a0f] text-white overflow-hidden">
      {/* Top Nav Bar */}
      <Nav />

      {/* Main Container */}
      {!hasMessages ? (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Hero Header */}
          <div className="text-center space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono tracking-wider uppercase">
              <Terminal size={12} />
              <span>CORTEX COMMAND CENTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight">
              What do you want CortexAI to solve?
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
              Provider-independent adaptive AI platform. Automatically routes across models with zero disruption and minimal token spend.
            </p>
          </div>

          {/* Central Elegant Input Workspace */}
          <div className="w-full max-w-2xl bg-[#0e1117] border border-white/[0.09] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5">
            {selectedFile && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200">
                <FileText size={14} className="text-blue-400" />
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="p-0.5 text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <textarea
              rows={3}
              placeholder="Ask Cortex anything... (Task is dynamically analyzed, decomposed, and routed across models)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim() && !isLoading) {
                    handleRunTask();
                  }
                }
              }}
              className="w-full bg-transparent outline-none resize-none text-[14.5px] text-slate-100 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />

            {/* Controls Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  hidden
                  ref={fileRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors border-none bg-transparent cursor-pointer"
                  title="Attach PDF or Document"
                >
                  <Paperclip size={15} />
                </button>
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2 rounded-lg transition-colors border-none cursor-pointer ${
                    listening ? "bg-rose-500 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] bg-transparent"
                  }`}
                  title="Voice Input"
                >
                  {listening ? <Mic size={15} /> : <MicOff size={15} />}
                </button>
              </div>

              {isLoading ? (
                <button
                  onClick={handleStopExecution}
                  disabled={isStopping}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-all"
                >
                  {isStopping ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Stopping...</span>
                    </>
                  ) : (
                    <>
                      <Square size={12} className="fill-current" />
                      <span>Stop</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleRunTask()}
                  disabled={!prompt.trim() && !selectedFile}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${
                    prompt.trim() || selectedFile
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-white/[0.05] text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Run with Cortex</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Lightweight Telemetry Row */}
          <TokenEfficiencyWidget onViewInsights={onViewInsights} />

          {/* Sample Prompts */}
          <div className="w-full max-w-2xl space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 text-center">
              Suggested Tasks
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleRunTask(p)}
                  className="p-3 text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] text-xs text-slate-300 transition-all cursor-pointer leading-snug"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Cortex Continuity Guarantee Section */}
          <div className="w-full max-w-2xl">
            <CortexContinuitySection />
          </div>
        </div>
      ) : (
        /* Active Conversation Flow */
        <div className="flex-1 flex flex-col min-h-0">
          <MessageList />

          {/* Refined Bottom Input Bar */}
          <div className="w-full px-3 sm:px-6 py-3 border-t border-white/[0.06] bg-[#090a0f]">
            <div className="max-w-4xl mx-auto bg-[#0e1117] border border-white/[0.08] rounded-2xl p-3 flex flex-col gap-2 shadow-lg">
              {selectedFile && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200">
                  <FileText size={13} className="text-blue-400" />
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="p-0.5 text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <textarea
                rows={2}
                placeholder={isLoading ? "Executing task across model pool..." : "Ask Cortex anything..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (prompt.trim() && !isLoading) {
                      handleRunTask();
                    }
                  }
                }}
                className="w-full bg-transparent outline-none resize-none text-[13.5px] text-slate-100 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              />

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    hidden
                    ref={fileRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <Paperclip size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-1.5 rounded-lg transition-colors border-none cursor-pointer ${
                      listening ? "bg-rose-500 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] bg-transparent"
                    }`}
                  >
                    {listening ? <Mic size={14} /> : <MicOff size={14} />}
                  </button>
                </div>

                {isLoading ? (
                  <button
                    onClick={handleStopExecution}
                    disabled={isStopping}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-all"
                  >
                    {isStopping ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Stopping...</span>
                      </>
                    ) : (
                      <>
                        <Square size={11} className="fill-current" />
                        <span>Stop</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRunTask()}
                    disabled={!prompt.trim() && !selectedFile}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${
                      prompt.trim() || selectedFile
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                        : "bg-white/[0.05] text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <span>Run</span>
                    <Send size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
