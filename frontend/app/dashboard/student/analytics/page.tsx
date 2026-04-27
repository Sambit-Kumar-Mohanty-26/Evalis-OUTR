"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, TrendingUp, Loader2, Activity, GraduationCap,
    Shield, Zap, Award, Target, BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsModeProvider, ModeSwitcher, useAnalyticsMode } from "@/lib/analytics-mode-context";
import {
    ChartCard, AnimatedBarChart, AnimatedLineChart,
    FilterBar, SmartInsight, StatsCounter, ExportButton,
} from "@/components/analytics";
import { studentMockData } from "@/components/analytics/mockData";

function StudentAnalyticsContent() {
    const { mode } = useAnalyticsMode();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});

    useEffect(() => {
        if (mode === "dev") {
            setLoading(true);
            Promise.all([
                api.get("/api/v1/analytics/student/personal"),
                api.get("/api/v1/analytics/student/comparison"),
                api.get("/api/v1/analytics/student/backlogs"),
            ])
                .then(([personal, comparison, backlogs]) => setData({ ...personal, ...comparison, backlogs }))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [mode]);

    const d = mode === "mock" ? studentMockData : data;

    if (mode === "dev" && loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;
    if (mode === "dev" && !d) return <div className="text-center py-32"><Activity size={48} className="mx-auto text-[#1C1C1A]/10 mb-4" /><p className="text-lg font-serif text-[#1C1C1A]/40">No data. Switch to Mock mode.</p></div>;

    const filterConfigs = [
        { key: "semester", label: "Semester", options: [1,2,3,4,5,6].map(s => ({ value: String(s), label: `Sem ${s}` })) },
    ];

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><GraduationCap size={14} /> Student Analytics</div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">My Academic Intelligence</h1>
                    <p className="text-[#1C1C1A]/40 mt-1">Personal performance, rank comparison, and backlog tracking.</p>
                </div>
                <ModeSwitcher />
            </div>

            <FilterBar filters={filterConfigs} values={filters} onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))} />

            {/* SECTION A: Personal Dashboard */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Zap size={14} /> Section A — Personal Dashboard</div>

                {/* Hero Stats */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-[2rem] bg-[#1C1C1A] p-8 shadow-2xl mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-4xl font-serif font-bold text-brand-green">
                                <StatsCounter value={d?.rank ?? 0} />
                            </div>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Class Rank</div>
                        </div>
                        <div>
                            <div className="text-4xl font-serif font-bold text-white">
                                <StatsCounter value={d?.percentile ?? 0} suffix="%" decimals={1} />
                            </div>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Percentile</div>
                        </div>
                        <div>
                            <div className="text-4xl font-serif font-bold text-white">
                                <StatsCounter value={d?.totalStudents ?? 0} />
                            </div>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Total Students</div>
                        </div>
                        <div>
                            <div className={`text-4xl font-serif font-bold ${(d?.backlogs?.active ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                <StatsCounter value={d?.backlogs?.active ?? 0} />
                            </div>
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Active Backlogs</div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="SGPA Trend" subtitle="Semester-wise SGPA progression" icon={TrendingUp} delay={0.1} action={<ExportButton data={d?.sgpaTrend ?? []} filename="sgpa-trend" />}>
                        <AnimatedLineChart data={d?.sgpaTrend ?? studentMockData.sgpaTrend} dataKeys={[{ key: "sgpa", color: "#3D8528", name: "SGPA" }]} xKey="semester" yDomain={[5, 10]} />
                    </ChartCard>
                    <ChartCard title="CGPA Progress" subtitle="Cumulative GPA evolution" icon={Award} delay={0.2}>
                        <AnimatedLineChart data={d?.cgpaProgress ?? studentMockData.cgpaProgress} dataKeys={[{ key: "cgpa", color: "#3B82F6", name: "CGPA" }]} xKey="semester" yDomain={[5, 10]} />
                    </ChartCard>
                </div>

                <div className="mt-6">
                    <ChartCard title="Subject Performance" subtitle="Marks across subjects" icon={BarChart3} delay={0.3} action={<ExportButton data={d?.subjectPerformance ?? []} filename="subject-perf" />}>
                        <AnimatedBarChart data={d?.subjectPerformance ?? studentMockData.subjectPerformance} dataKey="marks" xKey="subject" fill="#3D8528" barSize={40} showLabel />
                    </ChartCard>
                </div>
            </div>

            {/* SECTION B: Comparison */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Activity size={14} /> Section B — Comparison with Class</div>
                <ChartCard title="My Marks vs Class Average" subtitle="Subject-wise comparison" icon={Target} delay={0.1} action={<ExportButton data={d?.classAvgComparison || studentMockData.classAvgComparison} filename="class-comparison" />}>
                    <div className="space-y-4">
                        {(d?.classAvgComparison || studentMockData.classAvgComparison).map((item: any, i: number) => {
                            const diff = item.myMarks - item.classAvg;
                            return (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-[#1C1C1A]">{item.subject}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[#1C1C1A]/40">Avg: {item.classAvg}</span>
                                            <span className={`text-xs font-bold ${diff > 0 ? 'text-brand-green' : 'text-red-500'}`}>{diff > 0 ? '+' : ''}{diff}</span>
                                        </div>
                                    </div>
                                    <div className="relative h-4 bg-[#F4F2EB] rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.classAvg}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.8 }}
                                            className="absolute inset-y-0 left-0 bg-[#1C1C1A]/10 rounded-full" />
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.myMarks}%` }} transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                            className={`absolute inset-y-0 left-0 rounded-full ${diff > 0 ? 'bg-brand-green/60' : 'bg-red-400/60'}`} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </ChartCard>
            </div>

            {/* SECTION C: Backlog Tracker */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Shield size={14} /> Section C — Backlog Tracker</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50/50 border border-red-100 rounded-2xl p-5 text-center">
                        <div className="text-3xl font-serif font-bold text-red-500"><StatsCounter value={d?.backlogs?.active ?? studentMockData.backlogs.active} /></div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-1">Active</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-5 text-center">
                        <div className="text-3xl font-serif font-bold text-brand-green"><StatsCounter value={d?.backlogs?.cleared ?? studentMockData.backlogs.cleared} /></div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-1">Cleared</div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/50 border border-[#1C1C1A]/5 rounded-2xl p-5 text-center">
                        <div className="text-3xl font-serif font-bold text-[#1C1C1A]"><StatsCounter value={(d?.backlogs?.active ?? 0) + (d?.backlogs?.cleared ?? studentMockData.backlogs.active + studentMockData.backlogs.cleared)} /></div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-1">Total</div>
                    </motion.div>
                </div>

                {(d?.backlogs?.history || studentMockData.backlogs.history).length > 0 && (
                    <ChartCard title="Backlog History" icon={BookOpen} delay={0.2}>
                        <div className="space-y-2">
                            {(d?.backlogs?.history || studentMockData.backlogs.history).map((b: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
                                    className={`flex items-center justify-between p-4 rounded-2xl border ${b.status === 'CLEARED' ? 'bg-brand-green/5 border-brand-green/10' : 'bg-red-50/50 border-red-100'}`}>
                                    <div>
                                        <p className="text-sm font-bold text-[#1C1C1A]">{b.subject}</p>
                                        <p className="text-[10px] text-[#1C1C1A]/40">{b.attempts} attempt{b.attempts > 1 ? 's' : ''}{b.clearedAt ? ` · Cleared ${new Date(b.clearedAt).toLocaleDateString()}` : ''}</p>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${b.status === 'CLEARED' ? 'bg-brand-green/10 text-brand-green' : 'bg-red-100 text-red-500'}`}>{b.status}</span>
                                </motion.div>
                            ))}
                        </div>
                    </ChartCard>
                )}
            </div>

            <SmartInsight insights={d?.insights || studentMockData.insights} delay={0.2} />
            <div className="pt-4 text-center text-[10px] text-[#1C1C1A]/20 font-sans tracking-[0.3em] uppercase">Evalis Student Analytics · Intelligence v2.0</div>
        </div>
    );
}

export default function StudentAnalytics() {
    return <AnalyticsModeProvider><StudentAnalyticsContent /></AnalyticsModeProvider>;
}
