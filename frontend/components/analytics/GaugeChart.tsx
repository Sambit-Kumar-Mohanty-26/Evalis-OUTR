"use client";

import { PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

interface GaugeChartProps {
    value: number;
    label?: string;
    sublabel?: string;
    height?: number;
    invert?: boolean;
}

function getGaugeColor(v: number, invert: boolean) {
    if (invert) {
        if (v <= 25) return "#10B981";
        if (v <= 55) return "#F59E0B";
        return "#EF4444";
    } else {
        if (v >= 75) return "#3D8528";
        if (v >= 45) return "#3B82F6";
        return "#F59E0B";
    }
}

export function GaugeChart({ value, label, sublabel, height = 190, invert = false }: GaugeChartProps) {
    const clamped = Math.min(100, Math.max(0, value));
    const color = getGaugeColor(clamped, invert);
    const data = [{ value: clamped }, { value: 100 - clamped }];

    return (
        <div className="relative flex flex-col items-center justify-end" style={{ height }}>
            <div className="absolute inset-0 flex items-center justify-center">
                <PieChart width={height * 1.6} height={height}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="88%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={height * 0.38}
                        outerRadius={height * 0.52}
                        dataKey="value"
                        animationBegin={400}
                        animationDuration={1300}
                        animationEasing="ease-out"
                        strokeWidth={0}
                    >
                        <Cell fill={color} />
                        <Cell fill="#1C1C1A" fillOpacity={0.05} />
                    </Pie>
                </PieChart>
            </div>

            {/* Center label */}
            <div className="relative z-10 text-center pb-3">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.65, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="text-3xl font-serif font-bold" style={{ color }}>
                        {label ?? `${clamped}%`}
                    </div>
                    {sublabel && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-0.5">
                            {sublabel}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Arc end labels */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4">
                <span className="text-[9px] font-black text-[#1C1C1A]/20 uppercase">
                    {invert ? "Low" : "0%"}
                </span>
                <span className="text-[9px] font-black text-[#1C1C1A]/20 uppercase">
                    {invert ? "High" : "100%"}
                </span>
            </div>
        </div>
    );
}
