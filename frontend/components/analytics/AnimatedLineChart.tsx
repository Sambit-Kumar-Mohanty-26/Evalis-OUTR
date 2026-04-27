"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface DataItem {
    [key: string]: any;
}

interface AnimatedLineChartProps {
    data: DataItem[];
    dataKeys: { key: string; color: string; name?: string }[];
    xKey: string;
    height?: number;
    showArea?: boolean;
    showDots?: boolean;
    yDomain?: [number, number];
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/90 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl px-4 py-3 shadow-xl min-w-[120px]">
            <p className="text-xs font-bold text-[#1C1C1A]/40 mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-[#1C1C1A]/60">{p.name || p.dataKey}:</span>
                    <span className="text-sm font-serif font-bold text-[#1C1C1A]">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export function AnimatedLineChart({
    data,
    dataKeys,
    xKey,
    height = 300,
    showArea = true,
    showDots = true,
    yDomain,
}: AnimatedLineChartProps) {
    if (showArea && dataKeys.length === 1) {
        const dk = dataKeys[0];
        return (
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 5 }}>
                    <defs>
                        <linearGradient id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={dk.color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" stroke="#1C1C1A" strokeOpacity={0.04} />
                    <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} domain={yDomain} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey={dk.key}
                        stroke={dk.color}
                        strokeWidth={3}
                        fill={`url(#gradient-${dk.key})`}
                        dot={showDots ? { r: 4, fill: dk.color, stroke: "#fff", strokeWidth: 2 } : false}
                        activeDot={{ r: 6, fill: dk.color, stroke: "#fff", strokeWidth: 3 }}
                        animationBegin={300}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        name={dk.name || dk.key}
                    />
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#1C1C1A" strokeOpacity={0.04} />
                <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} domain={yDomain} />
                <Tooltip content={<CustomTooltip />} />
                {dataKeys.map((dk) => (
                    <Line
                        key={dk.key}
                        type="monotone"
                        dataKey={dk.key}
                        stroke={dk.color}
                        strokeWidth={2.5}
                        dot={showDots ? { r: 4, fill: dk.color, stroke: "#fff", strokeWidth: 2 } : false}
                        activeDot={{ r: 6, fill: dk.color, stroke: "#fff", strokeWidth: 3 }}
                        animationBegin={300}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        name={dk.name || dk.key}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
