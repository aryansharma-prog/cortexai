import React, { useState, useEffect } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../../utils/firebase";
import api from "../../utils/axios";
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from "react-redux";
import { setUserdata } from "../redux/userSlice";
import NavigationSidebar from "../components/NavigationSidebar";
import CommandCenter from "../components/CommandCenter";
import RunsView from "../components/RunsView";
import ModelPoolView from "../components/ModelPoolView";
import KnowledgeView from "../components/KnowledgeView";
import InsightsView from "../components/InsightsView";
import ProfileView from "../components/ProfileView";
import Artifact from "../components/Artifact";
import OnboardingModal from "../components/OnboardingModal";
import { Loader2, AlertCircle, Sparkles, ShieldCheck, Terminal } from "lucide-react";

function Home() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("command"); // "command" | "runs" | "models" | "knowledge" | "insights" | "profile"
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token });
      if (data?.sessionId) {
        localStorage.setItem("cortex_session", data.sessionId);
      }
      dispatch(setUserdata(data));
      setLoginError("");

      // Trigger first-login onboarding modal if not previously completed or is a new user
      if (data?.hasCompletedOnboarding === false || data?.isNewUser) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("[Login Backend Error]", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to authenticate with server";
      setLoginError(msg);
    }
  };

  // Handle redirect sign-in result on page load
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setIsLoggingIn(true);
          const token = await result.user.getIdToken();
          await handleLogin(token);
        }
      } catch (error) {
        console.error("[Redirect Result Error]", error);
      } finally {
        setIsLoggingIn(false);
      }
    };
    checkRedirectResult();
  }, []);

  const googleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError("");
      const data = await signInWithPopup(auth, googleProvider);
      const token = await data.user.getIdToken();
      await handleLogin(token);
    } catch (error) {
      console.error("[Firebase Popup Error]", error);
      let userMsg = "Login failed. Please try again.";
      if (error?.code === "auth/popup-closed-by-user") {
        userMsg =
          "Sign-in popup was closed before completing. Please click below to try again.";
      } else if (error?.code === "auth/unauthorized-domain") {
        userMsg = "This domain is not authorized in Firebase Console.";
      } else if (error?.code === "auth/popup-blocked") {
        userMsg =
          "Popup was blocked by your browser. Redirecting to Google login...";
        setTimeout(() => {
          signInWithRedirect(auth, googleProvider);
        }, 1000);
        return;
      } else if (error?.message) {
        userMsg = error.message;
      }
      setLoginError(userMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex bg-[#faf8f5] text-slate-900 overflow-hidden font-sans">
      {/* Minimal Navigation Sidebar */}
      <NavigationSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#faf8f5] overflow-hidden">
        {activeTab === "command" && (
          <CommandCenter onViewInsights={() => setActiveTab("insights")} />
        )}
        {activeTab === "runs" && <RunsView />}
        {activeTab === "models" && <ModelPoolView />}
        {activeTab === "knowledge" && <KnowledgeView />}
        {activeTab === "insights" && <InsightsView />}
        {activeTab === "profile" && <ProfileView />}
      </main>

      {/* Artifact Drawer (Opens when markdown, code, or pdf files are generated) */}
      <Artifact />

      {/* First-Login API Key Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onCompleted={() => setShowOnboarding(false)}
      />

      {/* Authentication Modal if not logged in */}
      {!userData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="w-full max-w-[400px] bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                CortexAI
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Provider-independent adaptive AI platform. Autonomous routing across models with zero disruption and minimal token spend.
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-tight">{loginError}</span>
              </div>
            )}

            {/* Google Sign-in */}
            <button
              disabled={isLoggingIn}
              onClick={googleLogin}
              className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-semibold transition-all ${
                isLoggingIn
                  ? "bg-white/80 text-black/60 cursor-wait"
                  : "bg-white text-slate-900 hover:bg-slate-100 shadow-md cursor-pointer"
              }`}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={16} className="animate-spin text-slate-900" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <FcGoogle size={17} />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Security Guarantee */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={13} className="text-blue-400" />
              <span>AES-256-GCM BYOK credential security</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
