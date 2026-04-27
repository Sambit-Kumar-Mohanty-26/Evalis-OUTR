"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from "recharts";

interface BarDef {
    key: string;
    name: string;
    color: string;
}

interface GroupedBarChartProps {
    data: Record<string, any>[];
    xKey: string;
    bars: BarDef[];
    height?: number;
    layout?: "horizontal" | "vertical";
    barSize?: number;
    showLegend?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl px-4 py-3 shadow-xl min-w-[150px]">
            <p className="text-xs font-black text-[#1C1C1A]/50 mb-2 uppercase tracking-wider">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
                    <span className="text-xs text-[#1C1C1A]/60">{p.name}:</span>
                    <span className="text-sm font-serif font-bold text-[#1C1C1A]">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export function GroupedBarChart({
    data, xKey, bars, height = 300,
    layout = "horizontal", barSize = 16, showLegend = true,
}: GroupedBarChartProps) {
    const isVertical = layout === "vertical";
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout={layout}
                margin={{ top: 20, right: 20, bottom: 5, left: isVertical ? 100 : 5 }}
            >
                <CartesianGrid
                    strokeDasharray="6 6"
                    stroke="#1C1C1A"
                    strokeOpacity={0.04}
                    horizontal={!isVertical}
                    vertical={isVertical}
                />
                {isVertical ? (
                    <>
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.5 }} axisLine={false} tickLine={false} width={100} />
                    </>
                ) : (
                    <>
                        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                    </>
                )}
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1C1C1A", fillOpacity: 0.03, radius: 6 }} />
                {showLegend && (
                    <Legend
                        verticalAlign="bottom"
                        height={32}
                        formatter={(v) => (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1A", opacity: 0.5 }}>{v}</span>
                        )}
                    />
                )}
                {bars.map((bar, idx) => (
                    <Bar
                        key={bar.key}
                        dataKey={bar.key}
                        name={bar.name}
                        fill={bar.color}
                        radius={isVertical ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                        barSize={barSize}
                        animationBegin={200 + idx * 120}
                        animationDuration={1100}
                        animationEasing="ease-out"
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
