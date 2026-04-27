"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataItem {
    name: string;
    value: number;
    fill: string;
}

interface AnimatedPieChartProps {
    data: DataItem[];
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    showLabel?: boolean;
}

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="bg-white/90 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl px-4 py-3 shadow-xl">
            <p className="text-xs font-bold text-[#1C1C1A]">{d.name}</p>
            <p className="text-lg font-serif font-bold" style={{ color: d.payload.fill }}>
                {d.value}%
            </p>
        </div>
    );
}

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.08) return null;

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

export function AnimatedPieChart({
    data,
    height = 280,
    innerRadius = 60,
    outerRadius = 110,
    showLabel = true,
}: AnimatedPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={4}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    label={showLabel ? renderLabel : false}
                    labelLine={false}
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} className="transition-opacity hover:opacity-80" />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                        <span className="text-xs font-bold text-[#1C1C1A]/60 ml-1">{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
