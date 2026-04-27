"use client";

import { motion } from "framer-motion";
import { Lightbulb, Sparkles } from "lucide-react";

interface SmartInsightProps {
    insights: string[];
    delay?: number;
}

export function SmartInsight({ insights, delay = 0 }: SmartInsightProps) {
    if (!insights.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
        >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">
                <Sparkles size={14} />
                Smart Insights
            </div>
            <div className="grid gap-2">
                {insights.map((insight, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: delay + 0.1 + i * 0.08, duration: 0.5 }}
                        className="group flex items-start gap-3 p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl hover:bg-brand-green/10 transition-all duration-300"
                    >
                        <div className="w-7 h-7 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-brand-green/20 transition-colors">
                            <Lightbulb size={14} className="text-brand-green" />
                        </div>
                        <p className="text-xs text-[#1C1C1A]/70 leading-relaxed font-medium">
                            {insight}
                        </p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
