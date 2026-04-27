"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, TrendingUp, AlertTriangle, Users, Loader2,
    Activity, GraduationCap, Shield, Zap, TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsModeProvider, ModeSwitcher, useAnalyticsMode } from "@/lib/analytics-mode-context";
import {
    ChartCard, AnimatedPieChart, AnimatedBarChart, AnimatedLineChart,
    FilterBar, SmartInsight, StatsCounter, ExportButton,
} from "@/components/analytics";
import { advisorMockData } from "@/components/analytics/mockData";

function AdvisorAnalyticsContent() {
    const { mode } = useAnalyticsMode();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    useEffect(() => {
        if (mode === "dev") {
            setLoading(true);
            Promise.all([
                api.get("/api/v1/analytics/advisor/student-health"),
                api.get("/api/v1/analytics/advisor/subject-impact"),
            ])
                .then(([health, impact]) => setData({ ...health, ...impact }))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [mode]);

    const d = mode === "mock" ? advisorMockData : data;

    if (mode === "dev" && loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;
    if (mode === "dev" && !d) return <div className="text-center py-32"><Activity size={48} className="mx-auto text-[#1C1C1A]/10 mb-4" /><p className="text-lg font-serif text-[#1C1C1A]/40">No data. Switch to Mock mode.</p></div>;

    const filterConfigs = [
        { key: "semester", label: "Semester", options: [1,2,3,4,5,6].map(s => ({ value: String(s), label: `Sem ${s}` })) },
        { key: "subject", label: "Subject", options: [{ value: "math", label: "Mathematics III" }, { value: "ds", label: "Data Structures" }] },
    ];

    const selectedStudentData = (d?.sgpaTrends || advisorMockData.sgpaTrends).find((s: any) => s.student === selectedStudent);

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><GraduationCap size={14} /> Branch Advisor</div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">Advisor Analytics</h1>
                    <p className="text-[#1C1C1A]/40 mt-1">Student health, subject impact, and progression tracking.</p>
                </div>
                <ModeSwitcher />
            </div>

            <FilterBar filters={filterConfigs} values={filters} onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))} />

            {/* SECTION A: Student Health */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Zap size={14} /> Section A — Student Health</div>

                {/* At-Risk Banner */}
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-[2rem] bg-[#1C1C1A] p-8 shadow-2xl mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-white text-2xl font-serif mb-1">At-Risk Students</h2>
                            <p className="text-white/40 text-sm">Students with CGPA below 4.5 or 2+ active backlogs</p>
                        </div>
                        <div className="text-5xl font-serif font-bold text-red-400"><StatsCounter value={(d?.atRiskStudents || advisorMockData.atRiskStudents).length} /></div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* At-Risk Table */}
                    <ChartCard title="At-Risk Students" subtitle="Requires immediate intervention" icon={AlertTriangle} delay={0.1} action={<ExportButton data={d?.atRiskStudents || advisorMockData.atRiskStudents} filename="at-risk" />}>
                        <div className="space-y-2">
                            {(d?.atRiskStudents || advisorMockData.atRiskStudents).map((s: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                                    className={`flex items-center justify-between p-4 rounded-2xl border ${s.status === 'CRITICAL' ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                    <div>
                                        <p className="text-sm font-bold text-[#1C1C1A]">{s.name}</p>
                                        <p className="text-[10px] text-[#1C1C1A]/40 font-mono">{s.roll} · {s.backlogs} backlogs</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-serif font-bold ${s.status === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>{s.cgpa}</span>
                                        <p className={`text-[9px] font-black uppercase ${s.status === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>{s.status}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </ChartCard>

                    {/* Backlog Count + Promotion */}
                    <div className="space-y-6">
                        <ChartCard title="Backlog Count Distribution" icon={BarChart3} delay={0.2}>
                            <AnimatedBarChart data={d?.backlogCounts || advisorMockData.backlogCounts} dataKey="students" xKey="backlogs" fill="#3B82F6" showLabel barSize={48} />
                        </ChartCard>
                        <ChartCard title="Promotion Status" icon={GraduationCap} delay={0.3}>
                            <AnimatedPieChart data={d?.promotionStatus || advisorMockData.promotionStatus} innerRadius={50} outerRadius={90} />
                        </ChartCard>
                    </div>
                </div>
            </div>

            {/* SECTION B: Subject Impact */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Activity size={14} /> Section B — Subject Impact</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Subject-wise Failure Rate" icon={AlertTriangle} delay={0.1}>
                        <AnimatedBarChart data={d?.subjectFailureRate || advisorMockData.subjectFailureRate} dataKey="failRate" xKey="subject" fill="#EF4444" layout="vertical" barSize={18} />
                    </ChartCard>
                    <ChartCard title="Internal vs External Score" subtitle="Detecting teaching/exam difficulty gaps" icon={TrendingDown} delay={0.2}>
                        <AnimatedBarChart data={d?.internalVsExternal || advisorMockData.internalVsExternal} dataKey="internal" xKey="subject" fill="#3D8528" barSize={24} />
                    </ChartCard>
                </div>
            </div>

            {/* SECTION C: Student Progression */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6"><Shield size={14} /> Section C — Student Progression</div>
                <ChartCard title="SGPA Trend per Student" subtitle="Select a student to view their semester-wise progression" icon={TrendingUp} delay={0.1}>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(d?.sgpaTrends || advisorMockData.sgpaTrends).map((s: any) => (
                            <button key={s.student} onClick={() => setSelectedStudent(s.student)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedStudent === s.student ? 'bg-brand-green text-white' : 'bg-[#F4F2EB] text-[#1C1C1A]/50 hover:bg-[#1C1C1A]/5'}`}>
                                {s.student}
                            </button>
                        ))}
                    </div>
                    {selectedStudentData ? (
                        <AnimatedLineChart data={selectedStudentData.semesters} dataKeys={[{ key: "sgpa", color: "#3D8528", name: "SGPA" }]} xKey="sem" yDomain={[0, 10]} />
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-[#1C1C1A]/20 text-sm">Select a student above to view their SGPA trend</div>
                    )}
                </ChartCard>
            </div>

            <SmartInsight insights={d?.insights || advisorMockData.insights} delay={0.2} />
            <div className="pt-4 text-center text-[10px] text-[#1C1C1A]/20 font-sans tracking-[0.3em] uppercase">Evalis Branch Analytics · Intelligence v2.0</div>
        </div>
    );
}

export default function AdvisorAnalytics() {
    return <AnalyticsModeProvider><AdvisorAnalyticsContent /></AnalyticsModeProvider>;
}
