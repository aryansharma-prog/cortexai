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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#faf8f5]">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-[11px] font-mono mb-2 font-medium">
            <User size={11} className="text-orange-600" />
            <span>Account & Security</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Profile Settings
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-600 mt-1 leading-relaxed">
            Manage your credentials, connected model pool, security configuration, and routing preferences.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-600 border border-stone-200 hover:border-rose-200 text-xs font-medium transition-all shadow-2xs cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* User Information Card */}
      <div className="my-6 p-5 sm:p-6 rounded-2xl border border-stone-200 bg-white shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-lg font-bold shadow-xs">
            {userData?.avatar ? (
              <img
                src={userData.avatar}
                alt="avatar"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              (userData?.name || "U")[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight uppercase">
              {userData?.name || "CortexAI User"}
            </h2>
            <div className="text-xs text-stone-500 mt-0.5">{userData?.email || "Authenticated User"}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200/80 uppercase tracking-wider">
                {userData?.plan || "free"} plan
              </span>
              <span className="text-[11px] text-stone-500">
                {userData?.credits ?? 100} credits available
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowBilling(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-800 hover:text-orange-700 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer"
        >
          <Coins size={14} className="text-orange-500" />
          <span>Billing & Credits</span>
        </button>
      </div>

      {/* Usage & Performance Grid */}
      <div className="my-6">
        <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3 px-1 font-semibold">
          Usage & Telemetry
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-stone-400 font-medium">
              Connected Models
            </div>
            <div className="text-xl font-bold font-mono text-stone-900 mt-1">
              {connectedCount > 0 ? connectedCount : 6}
            </div>
            <div className="text-[10.5px] text-stone-500">
              {connectedCount > 0 ? "BYOK Active" : "6 system fallbacks"}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-stone-400 font-medium">
              Tasks Completed
            </div>
            <div className="text-xl font-bold font-mono text-stone-900 mt-1">
              {telemetry.totalExecutions || 0}
            </div>
            <div className="text-[10.5px] text-stone-500">
              Autonomous workflows
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-stone-400 font-medium">
              Tokens Saved
            </div>
            <div className="text-xl font-bold font-mono text-orange-600 mt-1">
              {Number(telemetry.tokensSaved || 0).toLocaleString()}
            </div>
            <div className="text-[10.5px] text-stone-500">
              Shared Notebook savings
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase text-stone-400 font-medium">
              Avg Context Reduction
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
              {telemetry.contextReductionPercent || 0}%
            </div>
            <div className="text-[10.5px] text-stone-500">
              Less prompt overhead
            </div>
          </div>
        </div>
      </div>

      {/* Model Connections & Security */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {/* Model Connections List */}
        <div className="p-5 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-stone-800 uppercase font-mono tracking-wider">
              Model Connections
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 border-none bg-transparent cursor-pointer p-0"
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
                  className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200/70"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConn ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-stone-300"
                      }`}
                    />
                    <span className="text-stone-800 font-semibold">{p.name || p.provider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-mono text-stone-500">
                      {isConn ? p.keyMask || "● Connected" : "○ Not Connected"}
                    </span>
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:text-orange-600 bg-white hover:bg-orange-50/50 rounded-lg border border-stone-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      {isConn ? "Manage" : "Connect"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Box */}
        <div className="p-5 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-3">
          <div className="text-xs font-bold text-stone-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-orange-600" />
            <span>Security Architecture</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 flex items-center justify-between">
              <span className="text-stone-700 font-medium">API Credentials</span>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200/80">
                AES-256-GCM Encrypted
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 flex items-center justify-between">
              <span className="text-stone-700 font-medium">Session Security</span>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200/80">
                Active (Redis Encapsulated)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 flex items-center justify-between">
              <span className="text-stone-700 font-medium">Plaintext Key Exposure</span>
              <span className="text-[11px] font-mono text-stone-600 font-medium px-2 py-0.5 bg-stone-100 rounded border border-stone-200">
                Zero (Masked UI Only)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 flex items-center justify-between">
              <span className="text-stone-700 font-medium">Model Isolation</span>
              <span className="text-[11px] font-mono text-orange-700 font-medium px-2 py-0.5 bg-orange-50 rounded border border-orange-200/80">
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
