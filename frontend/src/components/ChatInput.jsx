import {
  Code2,
  FileText,
  Globe,
  ImageIcon,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  Presentation,
  Send,
  Square,
  Loader2,
  X,
  Zap
} from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import sendMessage, { cancelExecutionRequest } from '../features/sendMessage'
import { useDispatch, useSelector } from 'react-redux'
import {
  addMessage,
  setArtifacts,
  setIsLoading,
  setIsStopping,
  setCurrentExecutionId,
  setMessages,
  clearLiveExecution
} from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { addConversation, setConvTitle, setSelectedConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'

function ChatInput() {
  const [value, setValue] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Auto")
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, isLoading, isStopping, currentExecutionId } = useSelector(state => state.message)
  const [selectedFile, setSelectedFile] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const fileRef = useRef(null)
  const abortControllerRef = useRef(null)
  const dispatch = useDispatch()

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = ""
      for (let index = event.resultIndex; index < event.results.length; index++) {
        transcript += event.results[index][0].transcript
      }
      setValue(transcript)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("speech recognition not supported")
      return;
    }
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  // Real "Stop Research" handler
  const handleStopResearch = async () => {
    if (isStopping) return;
    dispatch(setIsStopping(true));

    console.log("[ChatInput] Stopping ongoing research task...", currentExecutionId);

    // 1. Abort in-flight frontend network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Notify backend task manager to terminate background agent DAG & tools
    if (currentExecutionId) {
      await cancelExecutionRequest(currentExecutionId);
    }

    // 3. Update Redux states
    dispatch(setIsLoading(false));
    dispatch(setIsStopping(false));
    dispatch(clearLiveExecution());

    // 4. Record clean cancellation message preserving chat history
    dispatch(addMessage({
      role: "assistant",
      content: "⏹️ **Research stopped by user.**\n\nYou can refine your query or start a new research request below."
    }));
  };

  const handleSendMessage = async (promptOverride = null) => {
    const userPrompt = typeof promptOverride === "string" ? promptOverride.trim() : value.trim();
    const fileToSend = selectedFile;

    if (!userPrompt && !fileToSend) return;
    if (isLoading) return;

    // 1. Immediately reset inputs and render user message in UI
    setValue("");
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    dispatch(setCurrentExecutionId(executionId));
    dispatch(setIsLoading(true));
    dispatch(setIsStopping(false));
    dispatch(clearLiveExecution());
    dispatch(addMessage({ role: "user", content: userPrompt }));

    // Create fresh AbortController for this specific research execution
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 2. Ensure conversation is created or selected
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
    formData.append("agent", selectedAgent.toLowerCase());
    formData.append("executionId", executionId);
    if (fileToSend) {
      formData.append("file", fileToSend);
    }

    const data = await sendMessage(formData, signal);

    // If request was aborted during transit, stop processing
    if (signal.aborted) {
      console.log("[ChatInput] Ignoring late response because task was aborted.");
      return;
    }

    dispatch(setIsLoading(false));
    dispatch(clearLiveExecution());

    if (data?.status === "cancelled" || data?.isCancelled) {
      dispatch(addMessage({
        role: "assistant",
        content: "⏹️ **Research stopped by user.**\n\nYou can refine your prompt or start a new search below."
      }));
    } else if (data?.answer) {
      dispatch(setArtifacts(data.artifacts || []));
      dispatch(addMessage({
        role: "assistant",
        content: data.answer,
        images: data?.images || [],
        workflow: data?.workflow || null,
        metrics: data?.metrics || null,
        executionId: data?.executionId || executionId
      }));
    } else {
      dispatch(addMessage({
        role: "assistant",
        content: data?.error ? `⚠️ ${data.error}` : "Sorry, I encountered an issue processing your request. Please try again."
      }));
    }
  };

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto"
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat"
    },
    {
      id: "coding",
      icon: Code2,
      label: "Coding"
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF"
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT"
    },
    {
      id: "vision",
      icon: ImageIcon,
      label: "Vision"
    },
    {
      id: "search",
      icon: Globe,
      label: "Search"
    }
  ]

  return (
    <div className='w-full overflow-hidden px-2.5 sm:px-4 md:px-5 py-2.5 sm:py-3.5 border-t border-white/[0.06] bg-[#0d0f14]'>
      <div className='flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 sm:px-4 pt-3 pb-2.5'>

        <div className='flex w-full items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label
            const Icon = agent.icon
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.label)}
                className={`
            shrink-0
            cursor-pointer
            inline-flex
            items-center
            gap-1.5
            px-2.5 sm:px-3
            py-1.5 sm:py-2
            rounded-full
            text-[11px] sm:text-xs
            font-medium
            border
            transition-all
            whitespace-nowrap

            ${isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"
                  }
          `}>

                <Icon size={13}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-500"
                  } />

                {agent.label}

              </div>
            )
          })}
        </div>

        {selectedFile && (
          <div className='my-3'>
            <div className='inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2'>
              {selectedFile?.type === "application/pdf" ? (
                <FileText size={16} className="text-red-400" />
              ) : selectedFile.type.startsWith("image/") && (
                <img src={URL.createObjectURL(selectedFile)} className="h-10 w-10 rounded-xl object-cover mt-3" alt="preview" />
              )}

              <div>
                <p className='text-xs text-white'>{selectedFile?.name}</p>
                <p className='text-[10px] text-slate-500'>{Math.ceil(selectedFile.size)}KB</p>
              </div>
              <button className='ml-2' onClick={() => { setSelectedFile(null); fileRef.current.value = "" }}>
                <X size={14} className='text-slate-500 hover:text-white' />
              </button>
            </div>
          </div>
        )}

        <textarea
          placeholder={isLoading ? "Researching... (Click Stop to cancel)" : "Ask Anything... (Adaptive Multi-Agent will automatically analyze and orchestrate)"}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (value.trim() && !isLoading) {
                handleSendMessage();
              }
            }
          }}
          value={value}
          className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
          rows={3}
        />
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1'>
            <input
              type="file"
              accept='.pdf,image/*'
              hidden
              ref={fileRef}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setSelectedFile(file)
                }
              }}
            />

            <button
              disabled={isLoading}
              className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer disabled:opacity-40'
              onClick={() => fileRef.current.click()}
            >
              <Paperclip size={16} />
            </button>
            <button
              disabled={isLoading}
              onClick={toggleMic}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-40 ${
                listening ? "bg-red-500 text-white" : "text-slate-600 hover:bg-white/[0.05]"
              }`}
            >
              {listening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
          </div>

          {/* Action Button: Send when idle, Stop when researching */}
          {isLoading ? (
            <button
              onClick={handleStopResearch}
              disabled={isStopping}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-all duration-150 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
              title="Stop Research Execution"
            >
              {isStopping ? (
                <>
                  <Loader2 size={13} className='animate-spin' />
                  <span>Stopping...</span>
                </>
              ) : (
                <>
                  <Square size={13} className='fill-current' />
                  <span>Stop</span>
                </>
              )}
            </button>
          ) : (
            <button
              disabled={!value.trim() && !selectedFile}
              onClick={handleSendMessage}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-150 ${
                value.trim() || selectedFile
                  ? "bg-gradient-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white shadow-md"
                  : "bg-white/[0.05] text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInput
