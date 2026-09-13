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
  Info,
  Sliders,
  ChevronDown,
  Wand2,
  Activity
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
import getMessages from "../features/getMessages";
import MessageList from "./MessageList";
import TelemetryInspector from "./TelemetryInspector";
import TokenEfficiencyCircle from "./TokenEfficiencyCircle";

export default function CommandCenter({ onViewInsights }) {
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [listening, setListening] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedModelRoute, setSelectedModelRoute] = useState("Auto-Route (Best Speed & Cost)");
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const recognitionRef = useRef(null);
  const fileRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);
  const loadedConvIdRef = useRef(null);

  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages, isLoading, isStopping, currentExecutionId } = useSelector(
    (state) => state.message
  );
  const dispatch = useDispatch();

  // Load chat history messages whenever a conversation is selected or opened
  useEffect(() => {
    const fetchConversationMessages = async () => {
      if (!selectedConversation?._id) {
        loadedConvIdRef.current = null;
        return;
      }

      if (loadedConvIdRef.current === selectedConversation._id) {
        return;
      }

      if (isLoading && messages.length > 0) {
        loadedConvIdRef.current = selectedConversation._id;
        return;
      }

      if (selectedConversation.title === "New Chat" && messages.length > 0) {
        loadedConvIdRef.current = selectedConversation._id;
        return;
      }

      try {
        loadedConvIdRef.current = selectedConversation._id;
        const data = await getMessages(selectedConversation._id);
        dispatch(setMessages(data || []));
        const latestArtifactMessage = [...(data || [])]
          .reverse()
          .find((msg) => msg.artifacts && msg.artifacts.length > 0);
        dispatch(setArtifacts(latestArtifactMessage?.artifacts || []));
      } catch (err) {
        console.error("[fetchConversationMessages Error]", err);
      }
    };

    fetchConversationMessages();
  }, [selectedConversation?._id]);

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
        content: "⏹️ **Task execution stopped by operator.**\n\nTask state preserved in Shared Memory."
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

    if (conversation && conversation._id && (!conversation.title || conversation.title === "New Chat")) {
      const newTitle = userPrompt.slice(0, 40);
      updateConversation({ id: conversation._id, title: newTitle }).catch(console.error);
      dispatch(setConvTitle({ conversationId: conversation._id, title: newTitle }));
    }

    const formData = new FormData();
    formData.append("prompt", userPrompt);
    if (conversation?._id) {
      formData.append("conversationId", conversation._id);
    }
    formData.append("agent", "auto");
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
          content: "⏹️ **Task execution stopped by operator.**"
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
    "Design a distributed authentication and session invalidation architecture using JWT & Redis",
    "Compare Tesla and BYD market share, margins, and autonomous driving roadmap",
    "Build a high-performance streaming WebSocket gateway in Node.js & Go",
    "Explain Raft consensus algorithm step-by-step with state transitions"
  ];

  const hasMessages = messages && messages.length > 0;

  return (
    <div className="flex-1 flex min-w-0 bg-[#faf8f5] text-slate-900 overflow-hidden h-screen relative">
      {/* Floating Header Actions (Token Efficiency Circle + Telemetry Toggle) */}
      <div className="fixed top-5 right-6 z-30 flex items-center gap-2.5">
        <TokenEfficiencyCircle />
        <button
          onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          title="Toggle Live Telemetry & Artifacts"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 hover:bg-orange-50/80 border border-stone-200/90 hover:border-orange-300 text-xs font-mono font-medium text-slate-700 hover:text-orange-600 transition-all shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:shadow-[0_2px_10px_rgba(249,115,22,0.18)] cursor-pointer backdrop-blur-md"
        >
          <Activity size={14} className="text-orange-600" />
          <span>Live Telemetry</span>
        </button>
      </div>

      {/* Main Workspace Area (Chat Canvas + Inspector) */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {!hasMessages ? (
            /* Clean Empty State */
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-12 max-w-5xl mx-auto w-full flex flex-col items-center justify-center gap-6 radial-bg pb-36">
              {/* Hero Header */}
              <div className="text-center space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-mono font-semibold tracking-wider uppercase shadow-2xs">
                  <Terminal size={12} />
                  <span>CORTEX COMMAND CENTER</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  What do you want CortexAI to solve?
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  Autonomous Multi-Model Routing across Claude 3.7, DeepSeek V3, and Groq Llama with minimal token spend.
                </p>
              </div>

              {/* Sample Suggested Prompts */}
              <div className="w-full max-w-3xl space-y-2 pt-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-center font-medium">
                  Suggested Missions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleRunTask(p)}
                      className="p-3.5 text-left rounded-xl border border-stone-200 bg-white hover:bg-orange-50/40 hover:border-orange-300 text-xs text-slate-800 transition-all cursor-pointer leading-snug shadow-2xs group"
                    >
                      <span className="group-hover:text-orange-600 transition-colors font-medium">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Conversation Canvas */
            <MessageList />
          )}

          {/* ==================== BOTTOM FLOATING COMMAND DOCK (WHITE & SAFFRON ACCENT) ==================== */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 max-w-5xl mx-auto z-20">
            <div className="bg-white/95 backdrop-blur-xl border border-stone-200 rounded-xl p-2.5 shadow-[0_12px_36px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)] space-y-2">
              {/* Context Attachment Pills */}
              {selectedFile && (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-50 border border-stone-200 text-[11px] font-mono text-slate-800">
                    <FileText size={13} className="text-orange-600 font-semibold" />
                    <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="hover:text-red-500 text-xs ml-1 border-none bg-transparent cursor-pointer text-slate-400"
                      title="Remove attachment"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">File attached to context</span>
                </div>
              )}

              {/* Main Text Input Well */}
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    isLoading
                      ? "Executing task across model pool..."
                      : "How can I help you today ?"
                  }
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
                  className="w-full bg-stone-50/70 hover:bg-stone-50 text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] rounded-lg pl-3 pr-24 py-2.5 border border-stone-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />

                {/* Embedded Quick Action Buttons */}
                <div className="absolute right-2 flex items-center gap-1">
                  <input
                    type="file"
                    accept=".pdf,image/*,.json,.txt,.py,.js"
                    hidden
                    ref={fileRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-1.5 rounded-md transition-colors border-none cursor-pointer ${
                      listening
                        ? "bg-rose-500 text-white"
                        : "text-slate-400 hover:text-orange-600 bg-transparent"
                    }`}
                    title="Voice Input"
                  >
                    {listening ? <Mic size={15} /> : <MicOff size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-1.5 rounded-md text-slate-400 hover:text-orange-600 transition-colors border-none bg-transparent cursor-pointer"
                    title="Attach File Context"
                  >
                    <Paperclip size={15} />
                  </button>
                </div>
              </div>

              {/* Controls Toolbar */}
              <div className="flex items-center justify-between pt-1 px-1">
                <div className="flex items-center gap-2 relative">
                  {/* Model Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[11px] font-mono text-slate-700 transition-colors border-none cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="truncate max-w-[170px] sm:max-w-[240px] font-medium">
                        {selectedModelRoute}
                      </span>
                      <ChevronDown size={12} className="text-slate-400" />
                    </button>

                    {showModelDropdown && (
                      <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-stone-200 rounded-lg shadow-xl py-1 z-50 text-[11px] font-mono">
                        {[
                          "Auto-Route (Best Speed & Cost)",
                          "Claude 3.7 Sonnet (Deep Reasoning)",
                          "Groq Llama 3.3 70B (Ultra Low Latency)",
                          "DeepSeek V3 (Code Synthesis)"
                        ].map((m) => (
                          <button
                            key={m}
                            onClick={() => {
                              setSelectedModelRoute(m);
                              setShowModelDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-orange-50 transition-colors border-none cursor-pointer ${
                              selectedModelRoute === m ? "text-orange-600 font-semibold" : "text-slate-700"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optimize Prompt Sparkle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (prompt) {
                        setPrompt(
                          `Please provide a comprehensive, production-grade architectural analysis with step-by-step code and diagrams for: ${prompt}`
                        );
                      }
                    }}
                    className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-slate-600 hover:text-orange-600 hover:bg-orange-50/60 transition-colors border-none bg-transparent cursor-pointer font-medium"
                    title="Enhance prompt for optimal agent routing"
                  >
                    <Wand2 size={12} className="text-orange-600" />
                    <span>Optimize Prompt</span>
                  </button>
                </div>

                {/* Execute / Stop Button */}
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <button
                      onClick={handleStopExecution}
                      disabled={isStopping}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold cursor-pointer transition-all"
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
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
                        prompt.trim() || selectedFile
                          ? "bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 text-white shadow-[0_3px_12px_rgba(234,88,12,0.3)]"
                          : "bg-stone-100 text-slate-400 cursor-not-allowed border border-stone-200"
                      }`}
                    >
                      <span>Execute Task</span>
                      <span className="text-[11px] font-mono opacity-90">↵</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Telemetry Inspector Panel (Collapsible) */}
        {isInspectorOpen && (
          <TelemetryInspector onClose={() => setIsInspectorOpen(false)} />
        )}
      </div>
    </div>
  );
}
