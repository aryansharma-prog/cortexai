import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Key,
  Layers,
  Zap,
  Activity,
  LogOut,
  Coins,
  CheckCircle2,
  Lock,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { getUserProfile, getProviders } from "../features/providerApi";
import { getTokenEfficiency } from "../features/getTokenEfficiency";
import logOut from "../features/logOut";
import { setUserdata } from "../redux/userSlice";
import OnboardingModal from "./OnboardingModal";
import BillingDrawer from "./BillingDrawer";

export default function ProfileView() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [profileData, setProfileData] = useState(null);
  const [providers, setProviders] = useState([]);
  const [telemetry, setTelemetry] = useState({ tokensSaved: 0, contextReductionPercent: 0, totalExecutions: 0 });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const p = await getUserProfile();
      if (p) setProfileData(p);
      const provs = await getProviders();
      setProviders(provs?.providers || []);
      const eff = await getTokenEfficiency();
      if (eff) setTelemetry(eff);
    };
    loadData();
  }, []);

  const handleLogout = () => {
    logOut();
    dispatch(setUserdata(null));
  };

  const connectedProviders = providers.filter((p) => p.status === "connected");
  const connectedCount = connectedProviders.length;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono mb-2">
            <User size={11} />
            <span>Account & Security</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-100 tracking-tight">
            PROFILE
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-1 leading-relaxed">
            Manage your credentials, connected model pool, security configuration, and routing preferences.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/20 text-xs transition-colors cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* User Information Card */}
      <div className="my-6 p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0c0e14] flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-base font-bold shadow-md">
            {userData?.avatar ? (
              <img
                src={userData.avatar}
                alt="avatar"
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              (userData?.name || "U")[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight uppercase">
              {userData?.name || "CortexAI User"}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">{userData?.email || "Authenticated User"}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                {userData?.plan || "free"} plan
              </span>
              <span className="text-[11px] text-slate-500">
                {userData?.credits ?? 100} credits available
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowBilling(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/[0.08] transition-all cursor-pointer"
        >
          <Coins size={13} className="text-amber-400" />
          <span>Billing & Credits</span>
        </button>
      </div>

      {/* Usage & Performance Grid */}
      <div className="my-6">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 px-1">
          Usage & Telemetry
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-white/[0.07] bg-[#0c0e14] flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-slate-500">
              Connected Models
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {connectedCount > 0 ? connectedCount : 6}
            </div>
            <div className="text-[10.5px] text-slate-500">
              {connectedCount > 0 ? "BYOK Active" : "6 system fallbacks"}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.07] bg-[#0c0e14] flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-slate-500">
              Tasks Completed
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {telemetry.totalExecutions || 0}
            </div>
            <div className="text-[10.5px] text-slate-500">
              Autonomous workflows
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.07] bg-[#0c0e14] flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-slate-500">
              Tokens Saved
            </div>
            <div className="text-xl font-bold font-mono text-blue-400 mt-1">
              {Number(telemetry.tokensSaved || 0).toLocaleString()}
            </div>
            <div className="text-[10.5px] text-slate-500">
              Shared Notebook savings
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.07] bg-[#0c0e14] flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-slate-500">
              Avg Context Reduction
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {telemetry.contextReductionPercent || 0}%
            </div>
            <div className="text-[10.5px] text-slate-500">
              Less prompt overhead
            </div>
          </div>
        </div>
      </div>

      {/* Model Connections & Security */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {/* Model Connections List */}
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0e14] space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
              Model Connections
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 border-none bg-transparent cursor-pointer p-0"
            >
              Configure
            </button>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            {providers.slice(0, 5).map((p) => {
              const isConn = p.status === "connected";
              return (
                <div
                  key={p.provider}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConn ? "bg-emerald-400" : "bg-slate-600"
                      }`}
                    />
                    <span className="text-slate-200 font-medium">{p.name || p.provider}</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-slate-400">
                    {isConn ? p.keyMask || "● Connected" : "System Fallback"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Box */}
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0e14] space-y-3">
          <div className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-400" />
            <span>Security Architecture</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="text-slate-300">API Credentials</span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                AES-256-GCM Encrypted
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="text-slate-300">Session Security</span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                Active (Redis Encapsulated)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="text-slate-300">Plaintext Key Exposure</span>
              <span className="text-[11px] font-mono text-slate-400 font-medium">
                Zero (Masked UI Only)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="text-slate-300">Model Isolation</span>
              <span className="text-[11px] font-mono text-blue-400 font-medium">
                Shared Notebook Scoped
              </span>
            </div>
          </div>
        </div>
      </div>

      <OnboardingModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onCompleted={async () => {
          const provs = await getProviders();
          setProviders(provs?.providers || []);
          setShowConnectModal(false);
        }}
      />

      <BillingDrawer
        open={showBilling}
        onClose={() => setShowBilling(false)}
      />
    </div>
  );
}
