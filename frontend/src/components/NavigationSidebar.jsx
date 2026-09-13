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
  Coins,
  LogOut,
  ChevronRight,
  Sparkles,
  Search
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
import BillingDrawer from "./BillingDrawer";
import OnboardingModal from "./OnboardingModal";

export default function NavigationSidebar({
  activeTab,
  setActiveTab,
  onOpenOnboarding
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

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
    { id: "runs", label: "Runs", icon: Activity },
    { id: "models", label: "Model Pool", icon: Layers },
    { id: "knowledge", label: "Knowledge", icon: FileCode },
    { id: "insights", label: "Insights", icon: Zap },
    { id: "profile", label: "Profile", icon: User }
  ];

  if (collapsed) {
    return (
      <div className="hidden lg:flex flex-col items-center w-[58px] h-screen bg-[#0a0c12] border-r border-white/[0.06] py-4 gap-2 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors border-none bg-transparent cursor-pointer mb-2"
          title="Expand Sidebar"
        >
          <PanelRight size={17} />
        </button>

        <button
          onClick={handleNewChat}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-blue-600 hover:bg-blue-500 transition-colors border-none cursor-pointer shadow-md shadow-blue-500/20 mb-2"
          title="New Task / Chat"
        >
          <Plus size={16} />
        </button>

        <div className="flex-1 flex flex-col gap-1 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full h-9 rounded-xl flex items-center justify-center transition-colors border-none cursor-pointer ${
                  isActive
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] bg-transparent"
                }`}
                title={item.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        {/* Avatar */}
        <div
          onClick={() => setActiveTab("profile")}
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
          title="Profile"
        >
          {(userData?.name || "U")[0]?.toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3.5 z-50 flex items-center justify-center w-8 h-8 rounded-xl bg-[#0e1117] border border-white/[0.08] text-slate-300 hover:text-white cursor-pointer shadow-lg"
      >
        <Menu size={15} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] h-screen shrink-0 bg-[#0a0c12] border-r border-white/[0.06] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 font-bold text-xs">
              C
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>CortexAI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors border-none bg-transparent cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeft size={15} />
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>New Task / Chat</span>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <div className="px-2 py-1 space-y-0.5">
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border-none cursor-pointer text-left ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] bg-transparent"
                }`}
              >
                <Icon size={15} className={isActive ? "text-blue-400" : "text-slate-500"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-3 my-2 h-px bg-white/[0.05]" />

        {/* Recent Conversations */}
        <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-500">
          <span>Recent Workflows</span>
          <span className="text-slate-600">{conversations.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {conversations.length === 0 ? (
            <div className="py-4 px-3 text-[11px] text-slate-600 italic">
              No recent workflows
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = selectedConversation?._id === conv._id && activeTab === "command";
              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConv(conv)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive
                      ? "bg-blue-500/10 text-slate-100 font-medium"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <MessageSquare size={13} className="text-slate-500 shrink-0" />
                  <span className="truncate flex-1">{conv.title || "Untitled Workflow"}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer User Profile & Model Status */}
        <div className="p-3 border-t border-white/[0.06] bg-black/20 flex flex-col gap-2">
          {/* Quick Onboarding / BYOK Trigger */}
          <button
            onClick={() => setShowConnectModal(true)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-blue-400" />
              <span>Connect AI Models</span>
            </div>
            <ChevronRight size={12} className="text-slate-500" />
          </button>

          {/* User Capsule */}
          <div className="flex items-center justify-between pt-1">
            <div
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 hover:opacity-90"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(userData?.name || "U")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {userData?.name || "CortexAI User"}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {userData?.plan || "free"} plan
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowBilling(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/[0.04] transition-colors border-none bg-transparent cursor-pointer"
                title="Credits & Billing"
              >
                <Coins size={14} />
              </button>
              <button
                onClick={() => {
                  logOut();
                  dispatch(setUserdata(null));
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/[0.04] transition-colors border-none bg-transparent cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BYOK Connect Modal */}
      <OnboardingModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      <BillingDrawer
        open={showBilling}
        onClose={() => setShowBilling(false)}
      />
    </>
  );
}
