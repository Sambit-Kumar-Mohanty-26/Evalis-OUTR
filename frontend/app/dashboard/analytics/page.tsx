"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle, Shield,
    Users, BookOpen, Loader2, Activity, Zap, CheckCircle2, Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsModeProvider, ModeSwitcher, useAnalyticsMode } from "@/lib/analytics-mode-context";
import {
    ChartCard, AnimatedPieChart, AnimatedBarChart, AnimatedLineChart,
    HeatmapChart, StackedBarChart, FilterBar, SmartInsight,
    StatsCounter, PerformersTable, ExportButton,
} from "@/components/analytics";
import { adminMockData } from "@/components/analytics/mockData";

function AdminAnalyticsContent() {
    const { mode } = useAnalyticsMode();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});

    const [filterOptions, setFilterOptions] = useState<any>(null);

    useEffect(() => {
        if (mode === "dev") {
            setLoading(true);
            const queryParams = new URLSearchParams(filters).toString();
            Promise.all([
                api.get(`/api/v1/analytics/admin/overview?${queryParams}`),
                api.get(`/api/v1/analytics/admin/deep-insights?${queryParams}`),
                api.get(`/api/v1/analytics/admin/system-health?${queryParams}`),
                api.get("/api/v1/analytics/filters"),
            ])
                .then(([overview, insights, health, filtersData]) => {
                    setData({ ...overview, ...insights, ...health });
                    setFilterOptions(filtersData);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [mode, filters]);

    const d = mode === "mock" ? adminMockData : data;

    if (mode === "dev" && loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="animate-spin text-brand-green" size={32} />
            </div>
        );
    }

    if (mode === "dev" && !d) {
        return (
            <div className="text-center py-32">
                <Activity size={48} className="mx-auto text-[#1C1C1A]/10 mb-4" />
                <p className="text-lg font-serif text-[#1C1C1A]/40">No analytics data available yet.</p>
                <p className="text-xs text-[#1C1C1A]/30 mt-1">Switch to Mock mode to preview the dashboard.</p>
            </div>
        );
    }

    const filterConfigs = [
        { 
            key: "batch", 
            label: "Batch", 
            options: (filterOptions?.cohorts || []).map((c: any) => ({ value: c.id, label: c.name }))
        },
        { 
            key: "school", 
            label: "School", 
            options: (filterOptions?.mappings || [])
                .filter((m: any) => !filters.batch || m.cohort === filters.batch)
                .reduce((acc: {value: string, label: string}[], m: any) => {
                    if (!acc.find(x => x.value === m.schoolId)) {
                        acc.push({ value: m.schoolId, label: m.schoolName });
                    }
                    return acc;
                }, [])
        },
        { 
            key: "branch", 
            label: "Branch", 
            options: (filterOptions?.mappings || [])
                .filter((m: any) => 
                    (!filters.batch || m.cohort === filters.batch) && 
                    (!filters.school || m.schoolId === filters.school)
                )
                .reduce((acc: {value: string, label: string}[], m: any) => {
                    if (!acc.find(x => x.value === m.branchId)) {
                        acc.push({ value: m.branchId, label: m.branchName });
                    }
                    return acc;
                }, [])
        },
        { 
            key: "semester", 
            label: "Semester", 
            options: filterOptions?.semesters || []
        },
    ];

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2">
                        <BarChart3 size={14} /> Admin Analytics
                    </div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">Institutional Intelligence</h1>
                    <p className="text-[#1C1C1A]/40 mt-1">Full system-wide performance, insights, and health monitoring.</p>
                </div>
                <ModeSwitcher />
            </div>

            {/* Filters */}
            <FilterBar 
                filters={filterConfigs} 
                values={filters} 
                onChange={(k, v) => {
                    const newFilters = { ...filters, [k]: v };
                    if (k === "batch") {
                        delete newFilters.school;
                        delete newFilters.branch;
                        delete newFilters.semester;
                    }
                    if (k === "school") {
                        delete newFilters.branch;
                        delete newFilters.semester;
                    }
                    if (k === "branch") {
                        delete newFilters.semester;
                    }
                    setFilters(newFilters);
                }} 
            />

            {/* ═══ SECTION A: Performance Overview ═══ */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6">
                    <Zap size={14} /> Section A — Performance Overview
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Pass Rate", value: d?.passFailPie?.[0]?.value ?? 0, suffix: "%", color: "text-brand-green" },
                        { label: "Fail Rate", value: d?.passFailPie?.[1]?.value ?? 0, suffix: "%", color: "text-red-500" },
                        { label: "Total Students", value: d?.totalStudents ?? 0, suffix: "", color: "text-blue-500" },
                        { label: "Avg CGPA", value: d?.avgCgpa ?? 0, suffix: "", color: "text-purple-500", decimals: 2 },
                    ].map((kpi, i) => (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white/50 backdrop-blur-xl border border-[#1C1C1A]/5 rounded-2xl p-5"
                        >
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mb-1">{kpi.label}</div>
                            <div className={`text-3xl font-serif font-bold ${kpi.color}`}>
                                <StatsCounter value={kpi.value} suffix={kpi.suffix} decimals={kpi.decimals || 0} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Pass vs Fail" subtitle="Overall result distribution" icon={PieIcon} delay={0.1}
                        action={<ExportButton data={d?.passFailPie || []} filename="pass-fail" />}
                    >
                        <AnimatedPieChart data={d?.passFailPie || adminMockData.passFailPie} />
                    </ChartCard>

                    <ChartCard title="SGPA Distribution" subtitle="Performance spread across ranges" icon={BarChart3} delay={0.2}
                        action={<ExportButton data={d?.sgpaDistribution || []} filename="sgpa-dist" />}
                    >
                        <AnimatedBarChart data={d?.sgpaDistribution || adminMockData.sgpaDistribution} dataKey="count" xKey="range" useItemFill showLabel />
                    </ChartCard>

                    <ChartCard title="CGPA Trend" subtitle="Semester-wise progression" icon={TrendingUp} delay={0.3}
                        action={<ExportButton data={d?.cgpaTrend || []} filename="cgpa-trend" />}
                    >
                        <AnimatedLineChart data={d?.cgpaTrend || adminMockData.cgpaTrend} dataKeys={[{ key: "cgpa", color: "#3D8528", name: "CGPA" }]} xKey="semester" yDomain={[5, 10]} />
                    </ChartCard>
                </div>
            </div>

            {/* ═══ SECTION B: Deep Insights ═══ */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6">
                    <Activity size={14} /> Section B — Deep Insights
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <ChartCard title="Branch Comparison" subtitle="Pass rate by department" icon={Users} delay={0.1}
                        action={<ExportButton data={d?.branchComparison || []} filename="branch-comparison" />}
                    >
                        <AnimatedBarChart data={d?.branchComparison || adminMockData.branchComparison} dataKey="passRate" xKey="branch" useItemFill barSize={48} />
                    </ChartCard>

                    <ChartCard title="Subject Difficulty" subtitle="Highest failure rate subjects" icon={AlertTriangle} delay={0.2}
                        action={<ExportButton data={d?.subjectDifficulty ?? []} filename="subject-difficulty" />}
                    >
                        <AnimatedBarChart data={d?.subjectDifficulty ?? []} dataKey="failRate" xKey="subject" fill="#EF4444" layout="vertical" barSize={20} />
                    </ChartCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <ChartCard title="Backlog Distribution" subtitle="Semester-wise backlog count" icon={BookOpen} delay={0.3}>
                        <StackedBarChart
                            data={d?.backlogDistribution ?? adminMockData.backlogDistribution}
                            xKey="semester"
                            stackKeys={[
                                { key: "zero", color: "#3D8528", name: "0 Backlogs" },
                                { key: "one", color: "#F59E0B", name: "1 Backlog" },
                                { key: "twoPlus", color: "#EF4444", name: "2+ Backlogs" },
                            ]}
                        />
                    </ChartCard>

                    <ChartCard title="Subject Failure Heatmap" subtitle="Failure intensity across semesters" icon={Activity} delay={0.4}>
                        <HeatmapChart data={d?.subjectDifficulty?.map((s: any) => ({ semester: `Sem ${s.semester}`, subject: s.subject, failRate: s.failRate })) || adminMockData.subjectDifficulty.map(s => ({ semester: `Sem ${s.semester}`, subject: s.subject, failRate: s.failRate }))} />
                    </ChartCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Top Performers" subtitle="Highest CGPA students" icon={Users} delay={0.5}
                        action={<ExportButton data={d?.topPerformers || adminMockData.topPerformers} filename="top-performers" />}
                    >
                        <PerformersTable data={d?.topPerformers || adminMockData.topPerformers} type="top" />
                    </ChartCard>

                    <ChartCard title="Worst Performing Segments" subtitle="Branches with lowest pass rates" icon={AlertTriangle} delay={0.6}>
                        <div className="space-y-3">
                            {(d?.worstSegments || adminMockData.worstSegments).map((seg: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + i * 0.08 }}
                                    className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-[#1C1C1A]">{seg.segment}</p>
                                        <p className="text-[10px] text-red-500 mt-0.5">{seg.issue}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-serif font-bold text-red-500">{seg.passRate}%</span>
                                        <p className="text-[9px] text-[#1C1C1A]/30 font-bold uppercase">Pass Rate</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </ChartCard>
                </div>
            </div>

            {/* ═══ SECTION C: System Health ═══ */}
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-6">
                    <Shield size={14} /> Section C — System Health
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <ChartCard title="Marks Entry" subtitle="Completion status" icon={CheckCircle2} delay={0.1}>
                        <AnimatedPieChart data={d?.marksEntry || adminMockData.marksEntry} innerRadius={50} outerRadius={90} />
                    </ChartCard>

                    <ChartCard title="Result Publishing" subtitle="Exam result status" icon={Clock} delay={0.2}>
                        <div className="space-y-3">
                            {(d?.resultPublishing || adminMockData.resultPublishing).map((r: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-[#F4F2EB]/50 rounded-xl">
                                    <span className="text-xs font-bold text-[#1C1C1A]">{r.exam || r.name}</span>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                        r.status === 'Published' ? 'bg-brand-green/10 text-brand-green' :
                                        r.status === 'Processing' ? 'bg-amber-100 text-amber-600' :
                                        'bg-[#1C1C1A]/5 text-[#1C1C1A]/40'
                                    }`}>
                                        {r.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    <ChartCard title="Teacher Activity" subtitle="Marks entry by faculty" icon={Users} delay={0.3}>
                        <AnimatedBarChart data={d?.teacherActivity ?? []} dataKey="marksEntered" xKey="teacher" fill="#3B82F6" barSize={28} showLabel />
                    </ChartCard>
                </div>
            </div>

            {/* ═══ Smart Insights ═══ */}
            <SmartInsight insights={d?.insights || adminMockData.insights} delay={0.2} />

            {/* Footer */}
            <div className="pt-4 text-center text-[10px] text-[#1C1C1A]/20 font-sans tracking-[0.3em] uppercase">
                Evalis Analytics Engine · Institutional Intelligence v2.0
            </div>
        </div>
    );
}

export default function AdminAnalytics() {
    return (
        <AnalyticsModeProvider>
            <AdminAnalyticsContent />
        </AnalyticsModeProvider>
    );
}
