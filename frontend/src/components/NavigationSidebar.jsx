import React, { useState, useEffect } from "react";
import {
  Terminal,
  Activity,
  Layers,
  FileCode,
  Zap,
  User,
  Plus,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Menu,
  X,
  ShieldCheck,
  Settings,
  Sparkles,
  BookOpen,
  Share2,
  Sliders
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
import logOut from "../features/logOut";
import { setUserdata } from "../redux/userSlice";

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

  useEffect(() => {
    const loadConvs = async () => {
      const data = await getConversations();
      dispatch(setConversations(data || []));
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

  const handleSelectConv = (conv) => {
    if (selectedConversation?._id === conv?._id) return;
    dispatch(setSelectedConversation(conv));
    dispatch(clearLiveExecution());
    setActiveTab("command");
    setMobileOpen(false);
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
      <div className="hidden lg:flex flex-col items-center justify-between w-16 h-screen bg-[#191b23] border-r border-[#3c494e]/40 py-4 shrink-0 z-40">
        <div className="flex flex-col items-center gap-4 w-full">
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#859399] hover:text-[#e1e2ec] hover:bg-white/[0.05] transition-colors border-none bg-transparent cursor-pointer"
            title="Expand Sidebar"
          >
            <PanelRight size={17} />
          </button>

          <button
            onClick={handleNewChat}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#003543] bg-[#00d2ff] hover:brightness-110 shadow-glow-cyan-sm transition-all border-none cursor-pointer"
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
                      ? "bg-[#32353d] text-[#00d2ff] border border-[#00d2ff]/30 shadow-sm"
                      : "text-[#859399] hover:text-[#e1e2ec] hover:bg-white/[0.04] bg-transparent"
                  }`}
                  title={item.label}
                >
                  <Icon size={17} />
                  {isActive && (
                    <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* User avatar */}
        <div
          onClick={() => setActiveTab("profile")}
          className="w-8 h-8 rounded-lg bg-[#32353d] border border-[#00d2ff]/30 flex items-center justify-center text-[#a5e7ff] text-xs font-semibold cursor-pointer"
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
        className="lg:hidden fixed top-3 left-3.5 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-[#191b23] border border-[#3c494e]/60 text-[#e1e2ec] cursor-pointer shadow-lg"
      >
        <Menu size={16} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-[#0a0d14]/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Navigation Rail */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col justify-between w-60 bg-[#191b23] border-r border-[#3c494e]/40 select-none transition-transform duration-200 h-screen shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Header Logo & Identity */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#3c494e]/40">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#32353d] border border-[#00d2ff]/30 shadow-[0_0_12px_rgba(0,210,255,0.25)]">
                <Terminal size={16} className="text-[#00d2ff]" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00d2ff] animate-ping" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[#a5e7ff] tracking-tight">CortexAI</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#1d1f27] text-[#00d2ff] border border-[#00d2ff]/30 text-[10px] font-mono">
                    v2.4
                  </span>
                </div>
                <span className="text-[10px] text-[#859399] font-mono">Autonomous Orchestrator</span>
              </div>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-[#859399] hover:text-[#e1e2ec] hover:bg-white/[0.04] border-none bg-transparent cursor-pointer"
              title="Collapse Rail"
            >
              <PanelLeft size={15} />
            </button>
          </div>

          {/* New Run CTA Button */}
          <div className="px-3.5 pt-3.5 pb-2">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-[#00d2ff] text-[#003543] font-semibold text-xs py-2 rounded-lg shadow-glow-cyan active:scale-[0.98] hover:brightness-110 transition-all border-none cursor-pointer"
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
                      ? "text-[#a5e7ff] bg-[#32353d] border-l-2 border-[#00d2ff] shadow-sm font-semibold"
                      : "text-[#859399] hover:text-[#e1e2ec] hover:bg-[#272a32] bg-transparent"
                  }`}
                >
                  <Icon
                    size={15}
                    className={isActive ? "text-[#00d2ff]" : "text-[#859399]"}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
                  )}
                  {item.badge && !isActive && (
                    <span className="ml-auto text-[10px] text-[#00d2ff] font-mono">
                      {item.badge}
                    </span>
                  )}
                  {item.count && !isActive && (
                    <span className="ml-auto text-[10px] text-[#859399] font-mono bg-[#1d1f27] px-1.5 rounded">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Recent Runs Sublist */}
          {conversations && conversations.length > 0 && (
            <div className="mt-4 px-3 border-t border-[#3c494e]/30 pt-3">
              <span className="text-[10px] font-mono uppercase text-[#859399] tracking-wider px-1">
                Recent Threads
              </span>
              <div className="mt-1.5 space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
                {conversations.slice(0, 6).map((conv) => {
                  const isSel = selectedConversation?._id === conv._id;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => handleSelectConv(conv)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] truncate flex items-center gap-2 transition-colors border-none cursor-pointer ${
                        isSel
                          ? "bg-[#272a32] text-[#00d2ff] font-medium"
                          : "text-[#859399] hover:text-[#e1e2ec] hover:bg-white/[0.03] bg-transparent"
                      }`}
                    >
                      <MessageSquare size={12} className="shrink-0 opacity-70" />
                      <span className="truncate">{conv.title || "Untitled Run"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Cluster: Online Status & Operator Profile */}
        <div className="p-3 border-t border-[#3c494e]/40 space-y-2 bg-[#0b0e15]/80">
          {/* Status Online Pill */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#1d1f27] border border-[#3c494e]/30">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d2ff]" />
              </span>
              <span className="text-[11px] font-mono text-[#e1e2ec]">System Online</span>
            </div>
            <span className="text-[10px] font-mono text-[#00d2ff]">99.98%</span>
          </div>

          {/* User Operator Profile */}
          <div
            onClick={() => setActiveTab("profile")}
            className="flex items-center justify-between p-1.5 rounded-md hover:bg-[#272a32] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#32353d] border border-[#00d2ff]/30 flex items-center justify-center text-[#a5e7ff] text-xs font-semibold">
                {(userData?.name || "AV").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-[#e1e2ec] truncate max-w-[110px]">
                  {userData?.name || "Alex V."}
                </span>
                <span className="text-[10px] text-[#859399] font-mono">Principal Arch</span>
              </div>
            </div>
            <Settings size={14} className="text-[#859399]" />
          </div>
        </div>
      </aside>
    </>
  );
}
