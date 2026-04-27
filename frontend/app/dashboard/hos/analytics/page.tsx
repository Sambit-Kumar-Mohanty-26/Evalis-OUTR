"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, TrendingUp, AlertTriangle, Users, BookOpen, Loader2,
    Activity, GraduationCap, Flame, Shield, Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsModeProvider, ModeSwitcher, useAnalyticsMode } from "@/lib/analytics-mode-context";
import {
    ChartCard, AnimatedBarChart, AnimatedLineChart, HeatmapChart,
    FilterBar, SmartInsight, PerformersTable, ExportButton, StatsCounter,
} from "@/components/analytics";
import { hosMockData } from "@/components/analytics/mockData";

function HOSAnalyticsContent() {
    const { mode } = useAnalyticsMode();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const [filterOptions, setFilterOptions] = useState<any>(null);

    useEffect(() => {
        if (mode === "dev") {
            setLoading(true);
            Promise.all([
                api.get("/api/v1/analytics/hos/school-overview"),
                api.get("/api/v1/analytics/hos/teaching-quality"),
                api.get("/api/v1/analytics/filters"),
            ])
                .then(([overview, quality, filters]) => {
                    setData({ ...overview, ...quality });
                    setFilterOptions(filters);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [mode]);

    const d = mode === "mock" ? hosMockData : data;

    if (mode === "dev" && loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;
    if (mode === "dev" && !d) return <div className="text-center py-32"><Activity size={48} className="mx-auto text-[#1C1C1A]/10 mb-4" /><p className="text-lg font-serif text-[#1C1C1A]/40">No data. Switch to Mock mode.</p></div>;

    const filterConfigs = [
        { 
            key: "branch", 
            label: "Branch", 
            options: (filterOptions?.schools?.[0]?.branches || []).map((b: any) => ({ value: b.id, label: b.name }))
        },
        { 
            key: "semester", 
            label: "Semester", 
            options: filterOptions?.semesters || []
        },
    ];

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><GraduationCap size={14} /> School Analytics</div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">Head of School Intelligence</h1>
                    <p className="text-[#1C1C1A]/40 mt-1">School-wide performance, teaching quality, and student segmentation.</p>
                </div>
                <ModeSwitcher />
            </div>

            <FilterBar filters={filterConfigs} values={filters} onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))} />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "At-Risk Students", value: d?.atRiskCount ?? 0, color: "text-red-500" },
                    { label: "Avg Pass Rate", value: (d?.branchPerformance?.length ?? 0) > 0 ? (d.branchPerformance.reduce((s: number, b: any) => s + b.passRate, 0) / d.branchPerformance.length) : 0, suffix: "%", color: "text-brand-green", decimals: 0 },
                    { label: "Branches", value: (d?.branchPerformance?.length ?? 0), color: "text-blue-500" },
                    { label: "Top Failure Rate", value: d?.topFailureRate ?? 0, suffix: "%", color: "text-amber-500" },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white/50 backdrop-blur-xl border border-[#1C1C1A]/5 rounded-2xl p-5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mb-1">{kpi.label}</div>
                        <div className={`text-3xl font-serif font-bold ${kpi.color}`}><StatsCounter value={kpi.value} suffix={kpi.suffix ?? ""} decimals={kpi.decimals ?? 0} /></div>
                    </motion.div>
                ))}
            </div>

            {/* SECTION A */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Zap size={14} /> Section A — School Overview</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <ChartCard title="Branch-wise Performance" subtitle="Pass rate by department" icon={BarChart3} delay={0.1} action={<ExportButton data={d?.branchPerformance || []} filename="branch-perf" />}>
                        <AnimatedBarChart data={d?.branchPerformance || hosMockData.branchPerformance} dataKey="passRate" xKey="branch" fill="#3D8528" barSize={48} showLabel />
                    </ChartCard>
                    <ChartCard title="Pass % Trend" subtitle="Historical pass rate progression" icon={TrendingUp} delay={0.2}>
                        <AnimatedLineChart data={d?.passTrend ?? []} dataKeys={[{ key: "passRate", color: "#3D8528", name: "Pass %" }]} xKey="semester" yDomain={[60, 100]} />
                    </ChartCard>
                </div>
                <ChartCard title="Backlog Heatmap" subtitle="Failure intensity: Semester × Subject" icon={Flame} delay={0.3}>
                    <HeatmapChart data={d?.backlogHeatmap ?? []} />
                </ChartCard>
            </div>

            {/* SECTION B */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Activity size={14} /> Section B — Teaching Quality</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Teacher-wise Result Spread" subtitle="Average marks and deviation" icon={Users} delay={0.1} action={<ExportButton data={d?.teacherResults || hosMockData.teacherResults} filename="teacher-results" />}>
                        <div className="space-y-3">
                            {(d?.teacherResults || hosMockData.teacherResults).map((t: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="flex items-center justify-between p-4 bg-[#F4F2EB]/50 rounded-2xl border border-[#1C1C1A]/5">
                                    <div>
                                        <p className="text-sm font-bold text-[#1C1C1A]">{t.teacher}</p>
                                        <p className="text-[10px] text-[#1C1C1A]/40">Pass Rate: {t.passRate}%</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-serif font-bold text-[#1C1C1A]">{t.avgMarks}</span>
                                        <span className="text-xs text-[#1C1C1A]/30 ml-1">±{t.deviation}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </ChartCard>
                    <ChartCard title="Subject Failure Rate" subtitle="Highest failure subjects in school" icon={AlertTriangle} delay={0.2}>
                        <AnimatedBarChart data={d?.subjectFailureRate || hosMockData.subjectFailureRate} dataKey="failRate" xKey="subject" fill="#EF4444" layout="vertical" barSize={18} />
                    </ChartCard>
                </div>
            </div>

            {/* SECTION C */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Shield size={14} /> Section C — Student Segmentation</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Top 10% Students" subtitle="Highest performers in school" icon={Users} delay={0.1}>
                        <PerformersTable data={d?.topStudents || hosMockData.topStudents} type="top" />
                    </ChartCard>
                    <ChartCard title="Bottom 10% Students" subtitle="Students needing intervention" icon={AlertTriangle} delay={0.2}>
                        <PerformersTable data={d?.bottomStudents || hosMockData.bottomStudents} type="bottom" />
                    </ChartCard>
                </div>
            </div>

            <SmartInsight insights={d?.insights || hosMockData.insights} delay={0.2} />

            <div className="pt-4 text-center text-[10px] text-[#1C1C1A]/20 font-sans tracking-[0.3em] uppercase">Evalis School Analytics · Intelligence v2.0</div>
        </div>
    );
}

export default function HOSAnalytics() {
    return <AnalyticsModeProvider><HOSAnalyticsContent /></AnalyticsModeProvider>;
}
