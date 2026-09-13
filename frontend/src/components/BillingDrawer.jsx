import React from 'react'
import { AnimatePresence, motion } from "motion/react"
import { Crown, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { createOrder } from '../features/createOrder'
import { verifyPayment } from '../features/verifyPayment'
function BillingDrawer({ open, onClose }) {

    const { userData } = useSelector(state => state.user)

    const handleUpgrade = async (plan) => {
        try {
            const data = await createOrder(plan)
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data?.order?.amount,
                currency: data?.order?.currency,
                name: "CortexAI",
                description: `${data?.plan?.name} Plan`,
                order_id: data?.order?.id,
                handler: async (response) => {
                    try {
                        const data = await verifyPayment(response)
                        console.log(data)
                    } catch (error) {
                        console.log(error)
                    }
                },
                theme: {
                    color: "#4F46E5"
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <AnimatePresence>
            {open && <> 
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-40"
                />
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: .25, ease: "easeOut" }}
                    className="fixed right-0 top-0 z-50 h-screen w-full max-w-[390px] sm:w-[390px] bg-white border-l border-stone-200 shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className='flex items-center justify-between p-5 border-b border-stone-200 bg-stone-50/50'>
                        <div>
                            <div className='text-stone-900 text-lg font-bold tracking-tight'>
                                Billing & Plans
                            </div>
                            <div className='text-stone-500 text-xs mt-0.5'>
                                Manage credits & subscription tiers
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center cursor-pointer transition-colors text-stone-500 hover:text-stone-800"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Current Plan & Credits Summary */}
                    <div className='p-5'>
                        <div className='rounded-2xl bg-orange-50/60 border border-orange-200/80 p-5 shadow-2xs'>
                            <div className='flex justify-between items-center'>
                                <div>
                                    <p className='text-orange-800/80 text-xs font-semibold uppercase tracking-wider font-mono'>
                                        Current Plan
                                    </p>
                                    <h3 className='text-stone-900 text-2xl font-bold capitalize mt-0.5'>
                                        {userData?.plan || "Free"}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs">
                                    <Crown size={20} />
                                </div>
                            </div>

                            <div className='mt-5 pt-4 border-t border-orange-200/60'>
                                <div className='flex justify-between text-xs font-mono text-stone-600 mb-2'>
                                    <span className="font-medium">Credit Balance</span>
                                    <span className="font-bold text-orange-700">{userData?.credits || 0} / {userData?.totalCredits || 100}</span>
                                </div>

                                <div className='h-2.5 rounded-full bg-orange-200/60 overflow-hidden'>
                                    <div 
                                        className="h-full bg-orange-600 transition-all duration-500 rounded-full"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, (
                                                (userData?.credits || 0) /
                                                (userData?.totalCredits || 1)
                                            ) * 100))}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Available Plans */}
                    <div className='px-5 flex-1 overflow-y-auto space-y-3.5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                        <div className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 px-1">
                            Available Upgrade Tiers
                        </div>

                        <div className='rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all'>
                            <div className="flex items-center justify-between">
                                <h3 className='text-stone-900 font-bold text-base'>Starter Tier</h3>
                                <span className="text-[11px] font-mono font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">500 Credits</span>
                            </div>
                            <p className='text-orange-600 text-2xl font-bold font-mono mt-2'>₹199</p>
                            <p className='text-stone-500 text-xs mt-1'>Perfect for individual research, rapid prototyping, and daily tasks.</p>
                            <button 
                                className='mt-4 w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-2.5 text-xs font-semibold text-white shadow-xs shadow-orange-600/20 transition-all cursor-pointer' 
                                onClick={() => handleUpgrade("starter")}
                            >
                                Upgrade to Starter
                            </button>
                        </div>

                        <div className='rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50/40 to-white p-5 shadow-2xs hover:border-orange-400 hover:shadow-xs transition-all relative overflow-hidden'>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className='text-stone-900 font-bold text-base'>Pro Architect</h3>
                                    <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-300 uppercase">Popular</span>
                                </div>
                                <span className="text-[11px] font-mono font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">1000 Credits</span>
                            </div>
                            <p className='text-orange-600 text-2xl font-bold font-mono mt-2'>₹499</p>
                            <p className='text-stone-500 text-xs mt-1'>Designed for heavy multi-agent workflows, high-throughput runs, and team sync.</p>
                            <button 
                                className='mt-4 w-full rounded-xl bg-orange-600 hover:bg-orange-700 py-2.5 text-xs font-semibold text-white shadow-xs shadow-orange-600/20 transition-all cursor-pointer' 
                                onClick={() => handleUpgrade("pro")}
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
            }
        </AnimatePresence>
    )
}

export default BillingDrawer
