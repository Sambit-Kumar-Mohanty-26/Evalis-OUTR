"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

interface DataItem {
    [key: string]: any;
}

interface AnimatedBarChartProps {
    data: DataItem[];
    dataKey: string;
    xKey: string;
    height?: number;
    fill?: string;
    useItemFill?: boolean;
    showLabel?: boolean;
    barSize?: number;
    layout?: "horizontal" | "vertical";
    onClick?: (data: any) => void;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/90 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl px-4 py-3 shadow-xl">
            <p className="text-xs font-bold text-[#1C1C1A]/60 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-base font-serif font-bold" style={{ color: p.fill || p.color }}>
                    {p.value}{typeof p.value === 'number' && p.value <= 100 ? '%' : ''}
                </p>
            ))}
        </div>
    );
}

export function AnimatedBarChart({
    data,
    dataKey,
    xKey,
    height = 300,
    fill = "#3D8528",
    useItemFill = false,
    showLabel = false,
    barSize = 40,
    layout = "horizontal",
    onClick,
}: AnimatedBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout={layout}
                margin={{ top: 20, right: 20, bottom: 5, left: layout === "vertical" ? 80 : 5 }}
                onClick={onClick ? (e: any) => e?.activePayload && onClick(e.activePayload[0]?.payload) : undefined}
            >
                <CartesianGrid
                    strokeDasharray="6 6"
                    stroke="#1C1C1A"
                    strokeOpacity={0.04}
                    vertical={layout !== "vertical"}
                    horizontal={layout !== "horizontal"}
                />
                {layout === "vertical" ? (
                    <>
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.5 }} axisLine={false} tickLine={false} width={80} />
                    </>
                ) : (
                    <>
                        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#1C1C1A", fillOpacity: 0.3 }} axisLine={false} tickLine={false} />
                    </>
                )}
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1C1C1A", fillOpacity: 0.03, radius: 8 }} />
                <Bar
                    dataKey={dataKey}
                    fill={fill}
                    radius={[8, 8, 0, 0]}
                    barSize={barSize}
                    animationBegin={300}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    className={onClick ? "cursor-pointer" : ""}
                >
                    {useItemFill && data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || entry.color || fill} />
                    ))}
                    {showLabel && (
                        <LabelList dataKey={dataKey} position="top" className="text-xs font-bold fill-[#1C1C1A]/50" />
                    )}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
