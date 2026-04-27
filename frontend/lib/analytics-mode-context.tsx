"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Beaker, Radio } from "lucide-react";

type AnalyticsMode = "mock" | "dev";

interface AnalyticsModeContextType {
    mode: AnalyticsMode;
    setMode: (mode: AnalyticsMode) => void;
}

const AnalyticsModeContext = createContext<AnalyticsModeContextType>({
    mode: "mock",
    setMode: () => {},
});

export function useAnalyticsMode() {
    return useContext(AnalyticsModeContext);
}

export function AnalyticsModeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<AnalyticsMode>("mock");

    useEffect(() => {
        const stored = localStorage.getItem("evalis_analytics_mode");
        if (stored === "mock" || stored === "dev") setMode(stored);
    }, []);

    const handleSetMode = (m: AnalyticsMode) => {
        setMode(m);
        localStorage.setItem("evalis_analytics_mode", m);
    };

    return (
        <AnalyticsModeContext.Provider value={{ mode, setMode: handleSetMode }}>
            {children}
        </AnalyticsModeContext.Provider>
    );
}

export function ModeSwitcher() {
    const { mode, setMode } = useAnalyticsMode();

    return (
        <div className="flex items-center gap-1 p-1 bg-white/60 backdrop-blur-xl border border-[#1C1C1A]/5 rounded-2xl shadow-sm">
            <button
                onClick={() => setMode("mock")}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
                    mode === "mock"
                        ? "text-white"
                        : "text-[#1C1C1A]/40 hover:text-[#1C1C1A]/60"
                }`}
            >
                {mode === "mock" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-[#1C1C1A] rounded-xl shadow-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                    <Beaker size={14} />
                    Mock
                </span>
            </button>
            <button
                onClick={() => setMode("dev")}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
                    mode === "dev"
                        ? "text-white"
                        : "text-[#1C1C1A]/40 hover:text-[#1C1C1A]/60"
                }`}
            >
                {mode === "dev" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-brand-green rounded-xl shadow-lg shadow-brand-green/20"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                    <Radio size={14} />
                    Live
                </span>
            </button>
        </div>
    );
}
