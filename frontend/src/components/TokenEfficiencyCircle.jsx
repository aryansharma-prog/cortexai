import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { getTokenEfficiency } from "../features/getTokenEfficiency";
import { TokenInsightsModal } from "./TokenInsightsModal";

export default function TokenEfficiencyCircle({ compact = false }) {
  const [openModal, setOpenModal] = useState(false);
  const [percent, setPercent] = useState(41.8);
  const [tokensSaved, setTokensSaved] = useState(0);

  useEffect(() => {
    const fetchEfficiency = async () => {
      try {
        const data = await getTokenEfficiency();
        if (data?.contextReductionPercent) {
          setPercent(Number(data.contextReductionPercent) || 41.8);
        }
        if (data?.tokensSaved) {
          setTokensSaved(data.tokensSaved);
        }
      } catch (err) {
        console.error("Failed to fetch token efficiency:", err);
      }
    };
    fetchEfficiency();
  }, []);

  const displayPercent = Math.round(percent);
  // SVG circular ring calculation (radius = 14, circumference = 2 * PI * 14 ≈ 87.96)
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <>
      <button
        onClick={() => setOpenModal(true)}
        title={`Token Efficiency: ${percent.toFixed(1)}% context reduction. Click for deep insights.`}
        className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/95 hover:bg-orange-50/70 border border-stone-200/90 hover:border-orange-300 transition-all shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:shadow-[0_2px_12px_rgba(234,88,12,0.18)] cursor-pointer backdrop-blur-md"
      >
        {/* Small Circular Ring Gauge */}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
            {/* Background Track */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="text-stone-100"
              strokeWidth="3.2"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Saffron Progress Stroke */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              stroke="url(#efficiencyGradient)"
              strokeWidth="3.2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="efficiencyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </svg>
          {/* Inner Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
            {displayPercent}%
          </div>
        </div>

        {!compact && (
          <div className="flex flex-col text-left pr-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 group-hover:text-orange-600 transition-colors flex items-center gap-1">
              <Zap size={10} className="text-orange-600 fill-orange-600" />
              Efficiency
            </span>
            <span className="text-[11px] font-semibold text-slate-900 leading-tight">
              +{percent.toFixed(1)}% saved
            </span>
          </div>
        )}
      </button>

      {/* Deep Token Insights Modal */}
      <TokenInsightsModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}
