import { Check, Code2, Copy, Eye, PanelRightClose, PanelRightOpen, X } from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { AnimatePresence, easeInOut, motion } from "motion/react"
import Editor from '@monaco-editor/react';
function Artifact() {
  const [collapsed, setCollapsed] = useState(false)
  const { artifacts } = useSelector(state => state.message)
  const [tab, setTab] = useState("code")
  const [activeFile, setActiveFile] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  if (artifacts.length == 0) return;



  const file = artifacts[0]?.files[activeFile]
  const htmlFile = artifacts[0]?.files?.find(f => f.name == "index.html")
  const cssFile = artifacts[0]?.files?.find(f => f.name == "style.css")
  const jsFile = artifacts[0]?.files?.find(f => f.name == "script.js")

  const canPreview = Boolean(htmlFile)

  const previewDoc = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
     ${cssFile?.content || ""}
    </style>
</head>
<body>
 ${htmlFile?.content || ""} 
<script>
    ${jsFile?.content || ""}
</script>    
</body>
</html>`


  const handleCopy = async () => {
    await navigator.clipboard.writeText(file?.content || "")
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const detectLanguage = (fileName = "") => {
    const name = fileName.toLowerCase()

    if (name.endsWith(".html"))
      return "html";

    if (name.endsWith(".css"))
      return "css";

    if (name.endsWith(".js"))
      return "javascript";

    if (name.endsWith(".jsx"))
      return "javascript";

    if (name.endsWith(".ts"))
      return "typescript";

    if (name.endsWith(".tsx"))
      return "typescript";

    if (name.endsWith(".json"))
      return "json";

    if (name.endsWith(".py"))
      return "python";

    if (name.endsWith(".java"))
      return "java";

    if (name.endsWith(".cpp"))
      return "cpp";

    if (name.endsWith(".c"))
      return "c";

    return "plaintext";

  }

  const PanelContent = ({onClose}) => {
    return (
      <>
        {!collapsed ? <div className='flex flex-col h-full bg-white'>

          <div className='h-14 px-4 border-b border-stone-200 bg-stone-50/50 flex items-center gap-3 shrink-0'>
            <button className='flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0' onClick={onClose ?? (() => setCollapsed(true))}>
              {onClose?<X size={15}/>:<PanelRightClose size={16} />}
            </button>
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              <div className='flex items-center justify-center w-6 h-6 rounded-md bg-orange-50 border border-orange-200/80 shrink-0'>
                <Code2 className="text-orange-600" size={12} />
              </div>
              <div className='text-[13px] font-bold text-stone-900 truncate'>{artifacts[0]?.title}</div>
            </div>

            <div className='flex items-center gap-1 shrink-0'>
              <button
                onClick={handleCopy}
                className='flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors duration-150 bg-transparent border-none cursor-pointer'
              >
                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              </button>
            </div>
            {canPreview &&
              <div className='flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-lg'>
                <button
                  onClick={() => setTab("code")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all duration-150 cursor-pointer border-none
                  ${tab === "code" ? "bg-orange-600 text-white shadow-2xs" : "bg-transparent text-stone-500 hover:text-stone-800"}`}
                >
                  <Code2 size={11} /> Code
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all duration-150 cursor-pointer border-none
                  ${tab === "preview" ? "bg-orange-600 text-white shadow-2xs" : "bg-transparent text-stone-500 hover:text-stone-800"}`}
                >
                  <Eye size={11} /> Preview
                </button>
              </div>}

          </div>
          {tab === "code" && <div className='flex h-auto border-b border-stone-200 bg-stone-50/40 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0'>
            {
              artifacts[0]?.files?.map((f, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFile(index)}
                  className={`px-4 py-2.5 text-[11px] font-mono font-medium whitespace-nowrap transition-colors duration-150 border-r border-stone-200/70 relative cursor-pointer bg-transparent ${activeFile === index ? "text-orange-600 font-bold bg-white" : "text-stone-500 hover:text-stone-800"}`}
                >
                  {f?.name}
                  {activeFile === index && <div className='absolute bottom-0 left-0 right-0 h-[2px] bg-orange-600 rounded-t-full' />}
                </button>
              ))
            }
          </div>}

          <div className='flex-1 overflow-hidden bg-white'>
            {(tab == "preview" && canPreview) ? <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className='w-full h-full'
            >
              <iframe title='preview' srcDoc={previewDoc} sandbox='allow-scripts' className='w-full h-full bg-white border-none' />
            </motion.div>
              :
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className='w-full h-full'
              >
                <Editor
                  theme='vs'
                  language={detectLanguage(file?.name)}
                  value={file?.content}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, wordWrap: "on", automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 16 }, lineNumbers: "on", renderLineHighlight: "none" }}
                />
              </motion.div>
            }
          </div>

        </div> :
          <div className='hidden lg:flex h-full border-l border-stone-200 bg-stone-50 flex-col items-center py-4 gap-3 shrink-0'>
            <button className='flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0' onClick={() => setCollapsed(false)}>
              <PanelRightOpen size={16} />
            </button>
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              <div
                className='text-[10px] font-mono font-semibold text-stone-500 tracking-widest uppercase whitespace-nowrap'
                style={{
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)"
                }}
              >{artifacts[0]?.title}</div>
            </div>
          </div>}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-20 sm:bottom-24 right-3 sm:right-4 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11.5px] sm:text-[12px] font-semibold shadow-lg shadow-orange-600/20 border-none cursor-pointer transition-colors duration-150"
      >
        <Code2 size={13} />
        View Code
      </button>
      <AnimatePresence>
        {mobileOpen && <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs" />

          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.25, ease: "easeInOut" }} className="lg:hidden fixed inset-y-0 right-0 z-50 w-[92vw] sm:w-[88vw] max-w-[420px] border-l border-stone-200 overflow-hidden bg-white shadow-2xl">
            <PanelContent onClose={()=>setMobileOpen(false)}/>
          </motion.div>
        </>
        }
      </AnimatePresence>

      <motion.div
        initial={{ width: 400 }}
        animate={{ width: collapsed ? 48 : 400 }}
        transition={{
          duration: 0.25,
          ease: easeInOut
        }}
        className='hidden lg:flex h-full border-l border-stone-200 flex-col overflow-hidden shrink-0 bg-white'>
        <PanelContent />
      </motion.div>
    </>
  )
}

export default Artifact
