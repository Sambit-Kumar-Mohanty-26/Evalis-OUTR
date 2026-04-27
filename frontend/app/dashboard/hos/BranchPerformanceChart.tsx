"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1C1C1A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-serif text-white">{payload[0].value}% <span className="text-sm font-sans text-white/40">Pass Rate</span></p>
            </div>
        );
    }
    return null;
};

export function BranchPerformanceChart({ data }: { data: any[] }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-[400px] w-full relative"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none rounded-b-3xl" />
            
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#D97706" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.4}/>
                        </linearGradient>
                        {/* 3D Drop Shadow */}
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="10" stdDeviation="10" floodOpacity="0.15" />
                        </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                    <XAxis 
                        dataKey="branchName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#1C1C1A', fontSize: 11, fontWeight: 700 }}
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                    <Bar 
                        dataKey="passPercent" 
                        radius={[12, 12, 0, 0]} 
                        barSize={48}
                        filter="url(#shadow)"
                        animationDuration={1500}
                        animationEasing="ease-out"
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.passPercent >= 75 ? 'url(#colorGreen)' : entry.passPercent >= 50 ? 'url(#colorOrange)' : 'url(#colorRed)'} 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
