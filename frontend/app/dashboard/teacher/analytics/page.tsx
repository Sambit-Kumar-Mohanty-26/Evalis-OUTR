"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, TrendingUp, AlertTriangle, Users, Loader2,
    Activity, BookOpen, Shield, Zap, PieChart as PieIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsModeProvider, ModeSwitcher, useAnalyticsMode } from "@/lib/analytics-mode-context";
import {
    ChartCard, AnimatedPieChart, AnimatedBarChart,
    FilterBar, SmartInsight, PerformersTable, StatsCounter, ExportButton,
} from "@/components/analytics";
import { teacherMockData } from "@/components/analytics/mockData";

function TeacherAnalyticsContent() {
    const { mode } = useAnalyticsMode();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});

    useEffect(() => {
        if (mode === "dev") {
            setLoading(true);
            Promise.all([
                api.get("/api/v1/analytics/teacher/class-performance"),
                api.get("/api/v1/analytics/teacher/components"),
            ])
                .then(([perf, comp]) => setData({ ...perf, ...comp }))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [mode]);

    const d = mode === "mock" ? teacherMockData : data;

    if (mode === "dev" && loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;
    if (mode === "dev" && !d) return <div className="text-center py-32"><Activity size={48} className="mx-auto text-[#1C1C1A]/10 mb-4" /><p className="text-lg font-serif text-[#1C1C1A]/40">No data. Switch to Mock mode.</p></div>;

    const filterConfigs = [
        { key: "subject", label: "Subject", options: [{ value: "ds", label: "Data Structures" }, { value: "math", label: "Mathematics III" }] },
    ];

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><BookOpen size={14} /> Teacher Analytics</div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">Class Performance Intelligence</h1>
                    <p className="text-[#1C1C1A]/40 mt-1">Performance analysis, component breakdown, and student insights.</p>
                </div>
                <ModeSwitcher />
            </div>

            <FilterBar filters={filterConfigs} values={filters} onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))} />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Avg Score", value: d?.avgScore ?? 0, suffix: "/100", color: "text-brand-green", decimals: 1 },
                    { label: "Pass Rate", value: d?.passFailPie?.[0]?.value ?? 0, suffix: "%", color: "text-blue-500" },
                    { label: "Fail Rate", value: d?.passFailPie?.[1]?.value ?? 0, suffix: "%", color: "text-red-500" },
                    { label: "Internal Avg", value: d?.internalVsExternal?.internalAvg ?? 0, suffix: "/40", color: "text-purple-500" },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white/50 backdrop-blur-xl border border-[#1C1C1A]/5 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mb-1">{kpi.label}</div>
                        <div className={`text-3xl font-serif font-bold ${kpi.color}`}><StatsCounter value={kpi.value} suffix={kpi.suffix} decimals={kpi.decimals || 0} /></div>
                    </motion.div>
                ))}
            </div>

            {/* SECTION A */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Zap size={14} /> Section A — Class Performance</div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Pass vs Fail" icon={PieIcon} delay={0.1}>
                        <AnimatedPieChart data={d?.passFailPie ?? []} />
                    </ChartCard>
                    <ChartCard title="Marks Distribution" subtitle="Score range breakdown" icon={BarChart3} delay={0.2} className="lg:col-span-2" action={<ExportButton data={d?.marksDistribution ?? []} filename="marks-dist" />}>
                        <AnimatedBarChart data={d?.marksDistribution ?? []} dataKey="count" xKey="range" useItemFill showLabel barSize={48} />
                    </ChartCard>
                </div>
            </div>

            {/* SECTION B */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Activity size={14} /> Section B — Component Analysis</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Internal vs External */}
                    <ChartCard title="Internal vs External" subtitle="Performance comparison" icon={TrendingUp} delay={0.1}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-5 text-center">
                                    <div className="text-3xl font-serif font-bold text-brand-green">{d?.internalVsExternal?.internalAvg || 35}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-1">Internal Avg</div>
                                    <div className="text-xs text-[#1C1C1A]/40">out of {d?.internalVsExternal?.internalMax || 40}</div>
                                </div>
                                <div className={`border rounded-2xl p-5 text-center ${(d?.internalVsExternal?.externalAvg || 20) < 30 ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
                                    <div className={`text-3xl font-serif font-bold ${(d?.internalVsExternal?.externalAvg || 20) < 30 ? 'text-red-500' : 'text-blue-500'}`}>{d?.internalVsExternal?.externalAvg || 20}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-1">External Avg</div>
                                    <div className="text-xs text-[#1C1C1A]/40">out of {d?.internalVsExternal?.externalMax || 60}</div>
                                    {(d?.internalVsExternal?.externalAvg || 20) < 30 && <div className="text-[10px] text-red-400 mt-1 font-bold">⚠️ Below Expected</div>}
                                </div>
                            </div>
                        </div>
                    </ChartCard>

                    {/* Component-wise */}
                    <ChartCard title="Component-wise Performance" subtitle="Average across evaluation components" icon={BarChart3} delay={0.2}>
                        <div className="space-y-3">
                            {(d?.componentWise || teacherMockData.componentWise).map((c: any, i: number) => {
                                const pct = (c.avg / c.max) * 100;
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-[#1C1C1A]">{c.component}</span>
                                            <span className="text-xs text-[#1C1C1A]/40">{c.avg}/{c.max}</span>
                                        </div>
                                        <div className="h-3 bg-[#F4F2EB] rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                                className={`h-full rounded-full ${pct >= 70 ? 'bg-brand-green' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </ChartCard>
                </div>
            </div>

            {/* SECTION C */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Shield size={14} /> Section C — Student Insights</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Branch Highest" icon={Users} delay={0.1}>
                        <PerformersTable data={d?.highestStudents ?? []} type="highest" valueLabel="Total" valueKey="total" />
                    </ChartCard>
                    <ChartCard title="Weak Students" subtitle="Below pass threshold" icon={AlertTriangle} delay={0.2}>
                        <PerformersTable data={(d?.weakStudents ?? []).map((s: any, i: number) => ({ ...s, rank: i + 1 }))} type="bottom" valueLabel="Total" valueKey="total" />
                    </ChartCard>
                </div>
            </div>

            <SmartInsight insights={d?.insights || teacherMockData.insights} delay={0.2} />
            <div className="pt-4 text-center text-[10px] text-[#1C1C1A]/20 font-sans tracking-[0.3em] uppercase">Evalis Teacher Analytics · Intelligence v2.0</div>
        </div>
    );
}

export default function TeacherAnalytics() {
    return <AnalyticsModeProvider><TeacherAnalyticsContent /></AnalyticsModeProvider>;
}
