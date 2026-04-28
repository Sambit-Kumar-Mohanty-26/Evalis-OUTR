"use client";

import { motion } from "framer-motion";
import { Server } from "lucide-react";

export default function SystemPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3 pb-4 border-b border-[#1C1C1A]/5"
            >
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#1C1C1A] to-[#1C1C1A]/80 text-white flex items-center justify-center shadow-lg shadow-[#1C1C1A]/10">
                    <Server size={22} strokeWidth={1.5} className="text-brand-green" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">System Health</h1>
                    <p className="text-sm text-[#1C1C1A]/40 font-medium">Core infrastructure diagnostics and platform telemetry.</p>
                </div>
            </motion.div>

            {/* Main Content */}
        </div>
    );
}
