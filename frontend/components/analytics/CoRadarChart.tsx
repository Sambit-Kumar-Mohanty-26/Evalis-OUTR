"use client";

import {
    RadarChart as RechartsRadarChart,
    Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, Legend,
} from "recharts";

interface CoRadarChartProps {
    data: { co: string; [key: string]: any }[];
    keys: { key: string; color: string; name?: string }[];
    height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl px-4 py-3 shadow-xl">
            <p className="text-xs font-black text-[#1C1C1A]/50 mb-2 uppercase tracking-wider">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.stroke }} />
                    <span className="text-xs text-[#1C1C1A]/60">{p.name}:</span>
                    <span className="text-sm font-serif font-bold text-[#1C1C1A]">{p.value}%</span>
                </div>
            ))}
        </div>
    );
}

export function CoRadarChart({ data, keys, height = 300 }: CoRadarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#1C1C1A" strokeOpacity={0.07} gridType="polygon" />
                <PolarAngleAxis
                    dataKey="co"
                    tick={{ fontSize: 12, fill: "#1C1C1A", fillOpacity: 0.6, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {keys.map((k, i) => (
                    <Radar
                        key={k.key}
                        name={k.name || k.key}
                        dataKey={k.key}
                        stroke={k.color}
                        fill={k.color}
                        fillOpacity={i === 0 ? 0.18 : 0.08}
                        strokeWidth={2.5}
                        animationBegin={300}
                        animationDuration={1400}
                        animationEasing="ease-out"
                    />
                ))}
                {keys.length > 1 && (
                    <Legend
                        formatter={(v) => (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1A", opacity: 0.5 }}>{v}</span>
                        )}
                    />
                )}
            </RechartsRadarChart>
        </ResponsiveContainer>
    );
}
