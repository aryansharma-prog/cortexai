import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import React, { useState, useEffect } from 'react'
import { auth, googleProvider } from '../../utils/firebase'
import api from '../../utils/axios'
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from 'react-redux';
import { setUserdata } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';
import { Loader2, AlertCircle } from 'lucide-react';

function Home() {
    const { userData } = useSelector(state => state.user)
    const dispatch = useDispatch()
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [loginError, setLoginError] = useState("")

    const handleLogin = async (token) => {
        try {
            const { data } = await api.post("/api/auth/login", { token })
            if (data?.sessionId) {
                localStorage.setItem("cortex_session", data.sessionId)
            }
            dispatch(setUserdata(data))
            setLoginError("")
        } catch (error) {
            console.error("[Login Backend Error]", error)
            const msg = error?.response?.data?.message || error?.message || "Failed to authenticate with server"
            setLoginError(msg)
        }
    }

    // Handle redirect sign-in result on page load
    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth)
                if (result?.user) {
                    setIsLoggingIn(true)
                    const token = await result.user.getIdToken()
                    await handleLogin(token)
                }
            } catch (error) {
                console.error("[Redirect Result Error]", error)
            } finally {
                setIsLoggingIn(false)
            }
        }
        checkRedirectResult()
    }, [])

    const googleLogin = async () => {
        try {
            setIsLoggingIn(true)
            setLoginError("")
            const data = await signInWithPopup(auth, googleProvider)
            const token = await data.user.getIdToken()
            await handleLogin(token)
        } catch (error) {
            console.error("[Firebase Popup Error]", error)
            let userMsg = "Login failed. Please try again."
            if (error?.code === "auth/popup-closed-by-user") {
                userMsg = "Sign-in popup was closed before completing. Please click below to try again."
            } else if (error?.code === "auth/unauthorized-domain") {
                userMsg = "This domain is not authorized in Firebase Console."
            } else if (error?.code === "auth/popup-blocked") {
                userMsg = "Popup was blocked by your browser. Redirecting to Google login..."
                // Fallback to full page redirect if popup is blocked
                setTimeout(() => {
                    signInWithRedirect(auth, googleProvider)
                }, 1000)
                return
            } else if (error?.message) {
                userMsg = error.message
            }
            setLoginError(userMsg)
        } finally {
            setIsLoggingIn(false)
        }
    }

    return (
        <div className='h-screen h-[100dvh] flex bg-[#0d0f14] text-white overflow-hidden'>
            <SideBar />
            <ChatArea />
            <Artifact />

            {!userData && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur p-4'>
                    <div className='w-full max-w-[360px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-5 sm:p-7 flex flex-col gap-5 shadow-2xl'>
                        <div className='flex flex-col gap-1.5'>
                            <h2 className='text-[18px] font-semibold text-slate-100 tracking-tight'>Welcome to CortexAI</h2>
                            <p className='text-[13px] text-slate-400 leading-relaxed'>
                                Adaptive Multi-Agent AI Platform. Please sign in to continue.
                            </p>
                        </div>

                        {loginError && (
                            <div className='flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs'>
                                <AlertCircle size={15} className='shrink-0 text-rose-400 mt-0.5' />
                                <span className='leading-tight'>{loginError}</span>
                            </div>
                        )}

                        <button
                            disabled={isLoggingIn}
                            className={`w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium transition-all duration-150 ${
                                isLoggingIn
                                    ? "bg-white/80 text-black/60 cursor-wait"
                                    : "text-black/90 bg-white hover:bg-gray-200 cursor-pointer shadow-md"
                            }`}
                            onClick={googleLogin}
                        >
                            {isLoggingIn ? (
                                <>
                                    <Loader2 size={16} className='animate-spin text-black' />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <FcGoogle size={16} />
                                    <span>Continue With Google</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home
