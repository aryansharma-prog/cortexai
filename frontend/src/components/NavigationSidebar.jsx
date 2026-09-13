import React, { useState, useEffect } from "react";
import {
  Terminal,
  Activity,
  Layers,
  FileCode,
  Zap,
  User,
  Plus,
  PanelLeft,
  PanelRight,
  Menu,
  X,
  Settings,
  BookOpen,
  MessageSquare
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setSelectedConversation
} from "../redux/conversationSlice";
import {
  setMessages,
  setArtifacts,
  clearLiveExecution
} from "../redux/messageSlice";
import { getConversations } from "../features/getConversations";
import getMessages from "../features/getMessages";

export default function NavigationSidebar({
  activeTab,
  setActiveTab,
  onOpenOnboarding
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const dispatch = useDispatch();
  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversation
  );
  const { userData } = useSelector((state) => state.user);

  const [loadingConvs, setLoadingConvs] = useState(false);

  useEffect(() => {
    const loadConvs = async () => {
      try {
        setLoadingConvs(true);
        const data = await getConversations();
        dispatch(setConversations(data || []));
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoadingConvs(false);
      }
    };
    loadConvs();
  }, [userData?._id]);

  const handleNewChat = () => {
    dispatch(setSelectedConversation(null));
    dispatch(setMessages([]));
    dispatch(setArtifacts([]));
    dispatch(clearLiveExecution());
    setActiveTab("command");
    setMobileOpen(false);
  };

  const handleSelectConv = async (conv) => {
    if (!conv) return;
    dispatch(setSelectedConversation(conv));
    dispatch(clearLiveExecution());
    setActiveTab("command");
    setMobileOpen(false);
    try {
      const data = await getMessages(conv._id);
      dispatch(setMessages(data || []));
      const latestArtifactMessage = [...(data || [])]
        .reverse()
        .find((msg) => msg.artifacts && msg.artifacts.length > 0);
      dispatch(setArtifacts(latestArtifactMessage?.artifacts || []));
    } catch (err) {
      console.error("[handleSelectConv Error]", err);
    }
  };

  const navItems = [
    { id: "command", label: "Command Center", icon: Terminal },
    { id: "runs", label: "Execution Runs", icon: Activity, count: conversations?.length || 14 },
    { id: "models", label: "Model Pool", icon: Layers },
    { id: "knowledge", label: "Shared Knowledge", icon: BookOpen },
    { id: "insights", label: "Token Efficiency", icon: Zap, badge: "41.8%" },
    { id: "profile", label: "Settings", icon: Settings }
  ];

  if (collapsed) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-between w-16 h-screen bg-white border-r border-stone-200 py-4 shrink-0 z-40 shadow-xs">
        <div className="flex flex-col items-center gap-4 w-full">
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition-colors border-none bg-transparent cursor-pointer"
            title="Expand Sidebar"
          >
            <PanelRight size={17} />
          </button>

          <button
            onClick={handleNewChat}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 shadow-[0_4px_12px_rgba(234,88,12,0.28)] transition-all border-none cursor-pointer"
            title="New Run"
          >
            <Plus size={18} className="font-bold" />
          </button>

          <div className="flex flex-col gap-1 w-full px-2 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full h-10 rounded-lg flex items-center justify-center transition-colors border-none cursor-pointer relative ${
                    isActive
                      ? "bg-orange-50 text-orange-600 border border-orange-200 shadow-xs"
                      : "text-slate-400 hover:text-slate-800 hover:bg-stone-50 bg-transparent"
                  }`}
                  title={item.label}
                >
                  <Icon size={17} />
                  {isActive && (
                    <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.7)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* User avatar */}
        <div
          onClick={() => setActiveTab("profile")}
          className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 text-xs font-semibold cursor-pointer"
          title="Profile"
        >
          {(userData?.name || "AV").slice(0, 2).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3.5 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-stone-200 text-slate-700 cursor-pointer shadow-md"
      >
        <Menu size={16} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Navigation Rail */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col justify-between w-60 bg-white border-r border-stone-200 select-none transition-transform duration-200 h-screen shrink-0 shadow-xs ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Header Logo & Identity - Pure Text CortexAI */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200/80">
            <div className="flex items-center">
              <span className="text-lg font-semibold text-slate-900 tracking-tight font-sans">
                CortexAI
              </span>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-800 hover:bg-stone-100 border-none bg-transparent cursor-pointer"
              title="Collapse Rail"
            >
              <PanelLeft size={15} />
            </button>
          </div>

          {/* New Run CTA Button */}
          <div className="px-3.5 pt-3.5 pb-2">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold text-xs py-2 rounded-lg shadow-[0_4px_14px_rgba(234,88,12,0.28)] active:scale-[0.98] hover:brightness-105 transition-all border-none cursor-pointer"
            >
              <Plus size={15} className="font-bold" />
              <span>New Run</span>
            </button>
          </div>

          {/* Nav Items */}
          <nav className="mt-1 px-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all border-none cursor-pointer ${
                    isActive
                      ? "text-orange-700 bg-orange-50/80 border-l-2 border-orange-600 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-stone-50 bg-transparent"
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? "text-orange-600"
                        : "text-slate-400 group-hover:text-orange-600 transition-colors"
                    }
                  />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] text-orange-600 font-semibold font-mono bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && !item.badge && (
                    <span className="ml-auto text-[10px] text-slate-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 font-medium">
                      {item.count}
                    </span>
                  )}
                  {isActive && !item.badge && !item.count && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.7)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Chat History Section */}
          <div className="mt-4 px-3">
            <div className="flex items-center justify-between text-[11px] font-mono font-medium text-slate-500 uppercase tracking-wider px-1 pb-1.5">
              <span>Chat History</span>
              <span className="text-[10px] text-slate-400 font-mono">{conversations?.length || 0}</span>
            </div>

            <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-380px)] custom-scrollbar pr-0.5">
              {loadingConvs ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading chats...</div>
              ) : conversations && conversations.length > 0 ? (
                conversations.map((c) => {
                  const isSelected = selectedConversation?._id === c._id && activeTab === "command";
                  return (
                    <button
                      key={c._id}
                      onClick={() => handleSelectConv(c)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-all border-none cursor-pointer group ${
                        isSelected
                          ? "bg-orange-50 text-orange-700 font-semibold border border-orange-200/80 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-stone-50 bg-transparent"
                      }`}
                    >
                      <MessageSquare
                        size={13}
                        className={
                          isSelected
                            ? "text-orange-600 shrink-0"
                            : "text-slate-400 group-hover:text-orange-600 shrink-0 transition-colors"
                        }
                      />
                      <span className="truncate flex-1">
                        {c.title || "Untitled Task"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-3 text-center text-[11px] text-slate-400 font-mono">
                  No previous chats
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Cluster: Operator Profile */}
        <div className="p-3 border-t border-stone-200 space-y-2 bg-stone-50/50">
          {/* User Operator Profile */}
          <div
            onClick={() => setActiveTab("profile")}
            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white hover:border hover:border-stone-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 text-xs font-semibold">
                {(userData?.name || "AV").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {userData?.name || "Alex V."}
                </span>
              </div>
            </div>
            <Settings size={14} className="text-slate-400 hover:text-orange-600 transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
}
