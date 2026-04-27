"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DataItem {
    [key: string]: any;
}

interface StackedBarChartProps {
    data: DataItem[];
    xKey: string;
    stackKeys: { key: string; color: string; name: string }[];
    height?: number;
    barSize?: number;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/90 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl px-4 py-3 shadow-xl">
            <p className="text-xs font-bold text-[#1C1C1A]/40 mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-[#1C1C1A]/60">{p.name}:</span>
                    <span className="text-xs font-bold text-[#1C1C1A]">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export function StackedBarChart({
    data,
    xKey,
    stackKeys,
    height = 300,
    barSize = 32,
}: StackedBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#1C1C1A" strokeOpacity={0.04} />
                <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1C1C1A", fillOpacity: 0.03 }} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                        <span className="text-xs font-bold text-[#1C1C1A]/60 ml-1">{value}</span>
                    )}
                />
                {stackKeys.map((sk, idx) => (
                    <Bar
                        key={sk.key}
                        dataKey={sk.key}
                        stackId="a"
                        fill={sk.color}
                        name={sk.name}
                        barSize={barSize}
                        radius={idx === stackKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                        animationBegin={200 + idx * 100}
                        animationDuration={1000}
                        animationEasing="ease-out"
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
