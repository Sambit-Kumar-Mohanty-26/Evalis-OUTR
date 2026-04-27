"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart3, TrendingUp, Loader2, Activity, GraduationCap,
    Zap, Award, Target, BookOpen, Brain, Users,
    AlertTriangle, CheckCircle, Flame, FlaskConical,
    Trophy, LineChart as LineIcon, Gauge as GaugeIcon,
    Map, Network, ArrowUp, ArrowDown, Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    ChartCard, AnimatedBarChart, AnimatedLineChart,
    StackedBarChart, CoRadarChart, GaugeChart, GroupedBarChart,
    SmartInsight, StatsCounter, ExportButton,
} from "@/components/analytics";
import {
    studentInternalMockData,
    studentOverallMockData,
} from "@/components/analytics/mockData";
import { cn } from "@/lib/utils";

// ── Stable hero particle positions (deterministic, no Math.random in render) ──
const PARTICLES = [
    { id: 1, left: "6%",  top: "18%", size: 3, dur: 5.2, delay: 0 },
    { id: 2, left: "22%", top: "72%", size: 2, dur: 7.1, delay: 0.6 },
    { id: 3, left: "38%", top: "12%", size: 4, dur: 4.8, delay: 1.1 },
    { id: 4, left: "55%", top: "55%", size: 2, dur: 6.3, delay: 0.3 },
    { id: 5, left: "72%", top: "28%", size: 3, dur: 5.7, delay: 0.9 },
    { id: 6, left: "88%", top: "68%", size: 2, dur: 4.4, delay: 1.4 },
    { id: 7, left: "14%", top: "45%", size: 2, dur: 6.8, delay: 0.7 },
    { id: 8, left: "48%", top: "82%", size: 3, dur: 5.5, delay: 1.8 },
    { id: 9, left: "82%", top: "42%", size: 2, dur: 7.4, delay: 0.4 },
    { id: 10, left: "65%", top: "88%", size: 2, dur: 4.9, delay: 2.0 },
];

// ── Shared stagger helpers ────────────────────────────────────────────────────
const CUBIC = [0.16, 1, 0.3, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.6, delay, ease: CUBIC },
});

// ── Status helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
        Good:     { bg: "bg-brand-green/15",    text: "text-brand-green",  icon: CheckCircle },
        Risk:     { bg: "bg-amber-500/15",       text: "text-amber-400",    icon: AlertTriangle },
        Critical: { bg: "bg-red-500/15",         text: "text-red-400",      icon: Flame },
        PASS:     { bg: "bg-brand-green/15",     text: "text-brand-green",  icon: Trophy },
        FAIL:     { bg: "bg-red-500/15",         text: "text-red-400",      icon: AlertTriangle },
    };
    const cfg = map[status] ?? map.Good;
    const Icon = cfg.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest", cfg.bg, cfg.text)}>
            <Icon size={12} />
            {status}
        </span>
    );
}

// ── Subject Rank Table ────────────────────────────────────────────────────────
function SubjectRankTable({ data }: { data: typeof studentInternalMockData.subjectRanks }) {
    return (
        <div className="space-y-2.5">
            {data.map((row, i) => {
                const isTop = row.rank <= Math.ceil(row.total * 0.1);
                return (
                    <motion.div
                        key={row.subject}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 group"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                            isTop ? "bg-brand-green/15 text-brand-green" : "bg-[#1C1C1A]/5 text-[#1C1C1A]/40"
                        )}>
                            #{row.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-[#1C1C1A] truncate">{row.subject}</span>
                                <span className="text-[10px] font-black text-[#1C1C1A]/30 ml-2 shrink-0">{row.score}%</span>
                            </div>
                            <div className="h-1.5 bg-[#F4F2EB] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${row.score}%` }}
                                    transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className={cn("h-full rounded-full", isTop ? "bg-brand-green" : "bg-[#3B82F6]")}
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ── Performance Heatmap ───────────────────────────────────────────────────────
function PerformanceHeatmap({ data }: { data: typeof studentOverallMockData.performanceHeatmap }) {
    const sems = ["sem1", "sem2", "sem3", "sem4", "sem5"];
    const semLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"];

    function heatColor(v: number | null) {
        if (v === null) return { bg: "bg-[#1C1C1A]/3", text: "text-[#1C1C1A]/10", val: "—" };
        if (v >= 85) return { bg: "bg-emerald-500/20", text: "text-emerald-700", val: String(v) };
        if (v >= 70) return { bg: "bg-brand-green/15", text: "text-brand-green", val: String(v) };
        if (v >= 55) return { bg: "bg-blue-500/15",    text: "text-blue-600",    val: String(v) };
        if (v >= 40) return { bg: "bg-amber-500/15",   text: "text-amber-600",   val: String(v) };
        return             { bg: "bg-red-500/15",      text: "text-red-600",     val: String(v) };
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr>
                        <th className="text-left pb-3 pr-4 text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest w-32">Subject</th>
                        {semLabels.map(s => (
                            <th key={s} className="text-center pb-3 px-1 text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest">{s}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, ri) => (
                        <tr key={row.subject}>
                            <td className="pr-4 py-1.5 font-bold text-[#1C1C1A]/70 text-xs">{row.subject}</td>
                            {sems.map((sem, si) => {
                                const val = (row as any)[sem] as number | null;
                                const cfg = heatColor(val);
                                return (
                                    <td key={sem} className="px-1 py-1.5 text-center">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.7 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.05 + ri * 0.06 + si * 0.03 }}
                                            className={cn(
                                                "w-10 h-8 rounded-lg mx-auto flex items-center justify-center text-[10px] font-bold transition-all duration-200 hover:scale-110",
                                                cfg.bg, cfg.text
                                            )}
                                        >
                                            {cfg.val}
                                        </motion.div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
                {[
                    { label: "≥85 (Excellent)", bg: "bg-emerald-500/20", text: "text-emerald-700" },
                    { label: "70–84 (Good)", bg: "bg-brand-green/15", text: "text-brand-green" },
                    { label: "55–69 (Average)", bg: "bg-blue-500/15", text: "text-blue-600" },
                    { label: "<55 (Weak)", bg: "bg-red-500/15", text: "text-red-600" },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className={cn("w-3 h-3 rounded", l.bg)} />
                        <span className={cn("text-[10px] font-bold", l.text)}>{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Hero KPI Card ─────────────────────────────────────────────────────────────
function HeroKPI({ children, glowColor = "#3D8528", label }: {
    children: React.ReactNode;
    glowColor?: string;
    label: string;
}) {
    return (
        <motion.div
            {...fadeUp(0)}
            className="relative overflow-hidden rounded-4xl bg-[#1C1C1A] p-8 shadow-2xl mb-8"
        >
            {/* Floating particles */}
            {PARTICLES.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-brand-green/25 pointer-events-none"
                    style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
                    animate={{ y: [0, -8, 0], opacity: [0.15, 0.5, 0.15] }}
                    transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
                />
            ))}
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"
                style={{ background: `${glowColor}22` }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[70px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative z-10">
                <div className="text-[10px] font-black tracking-[0.25em] text-brand-green/60 uppercase mb-5">{label}</div>
                {children}
            </div>
        </motion.div>
    );
}

// ── INTERNAL ANALYTICS VIEW ───────────────────────────────────────────────────
function InternalView({ data }: { data: typeof studentInternalMockData }) {
    return (
        <motion.div key="internal" {...fadeUp(0)} className="space-y-8">

            {/* Hero KPI */}
            <HeroKPI label="INTERNAL ANALYTICS — LIVE SEMESTER TRACKING">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                    <div>
                        <div className="text-4xl font-serif font-bold text-brand-green">
                            <StatsCounter value={data.internalScore} decimals={1} suffix="%" />
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">Internal Score</div>
                    </div>
                    <div>
                        <div className="text-3xl font-serif font-bold text-white/70">
                            <StatsCounter value={data.classAvg} decimals={1} suffix="%" />
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">Class Average</div>
                    </div>
                    <div>
                        <div className="text-3xl font-serif font-bold text-white">
                            {data.rank > 0 ? (
                                <><StatsCounter value={data.rank} /><span className="text-lg font-sans text-white/25"> / {data.totalStudents}</span></>
                            ) : "—"}
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">Class Rank</div>
                    </div>
                    <div>
                        <div className={cn("text-3xl font-serif font-bold", data.attendance >= 75 ? "text-brand-green" : "text-red-400")}>
                            <StatsCounter value={data.attendance} decimals={1} suffix="%" />
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">Attendance</div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <StatusBadge status={data.status} />
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest">Status</div>
                    </div>
                </div>
            </HeroKPI>

            {/* Row 1: Subject Performance + Component Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Subject-wise Internal Performance"
                    subtitle="Your internal % vs class average"
                    icon={BarChart3}
                    delay={0.1}
                    className="hover:scale-[1.01] transition-transform"
                    action={<ExportButton data={data.subjectInternalPerformance} filename="internal-subject" />}
                >
                    <GroupedBarChart
                        data={data.subjectInternalPerformance}
                        xKey="subject"
                        bars={[
                            { key: "internal", name: "You",        color: "#3D8528" },
                            { key: "classAvg", name: "Class Avg",  color: "#3B82F6" },
                        ]}
                        height={280}
                        barSize={14}
                    />
                </ChartCard>

                <ChartCard
                    title="Component Breakdown"
                    subtitle="Quiz · Assignment · Mid Sem · Attendance per subject"
                    icon={Zap}
                    delay={0.15}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <StackedBarChart
                        data={data.componentBreakdown}
                        xKey="subject"
                        stackKeys={[
                            { key: "quiz",       name: "Quiz",       color: "#3D8528" },
                            { key: "assignment", name: "Assignment",  color: "#3B82F6" },
                            { key: "mid",        name: "Mid Sem",     color: "#8B5CF6" },
                            { key: "attendance", name: "Attendance",  color: "#F59E0B" },
                        ]}
                        height={280}
                    />
                </ChartCard>
            </div>

            {/* Row 2: CO Attainment + CO Contribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="CO Attainment (Internal)"
                    subtitle="Course Outcome achievement vs class average"
                    icon={Network}
                    delay={0.2}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <CoRadarChart
                        data={data.coAttainment}
                        keys={[
                            { key: "attainment", color: "#3D8528", name: "Your Attainment" },
                            { key: "classAvg",   color: "#3B82F6", name: "Class Average"  },
                        ]}
                        height={280}
                    />
                </ChartCard>

                <ChartCard
                    title="CO Contribution Breakdown"
                    subtitle="Which component drives each Course Outcome"
                    icon={Target}
                    delay={0.25}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <StackedBarChart
                        data={data.coContribution}
                        xKey="co"
                        stackKeys={[
                            { key: "quiz",       name: "Quiz",       color: "#3D8528" },
                            { key: "assignment", name: "Assignment",  color: "#3B82F6" },
                            { key: "mid",        name: "Mid Sem",     color: "#8B5CF6" },
                        ]}
                        height={280}
                    />
                </ChartCard>
            </div>

            {/* Row 3: Class Comparison + Subject Rank */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Class Comparison"
                    subtitle="You vs Class Average vs Topper"
                    icon={Users}
                    delay={0.3}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <AnimatedBarChart
                        data={data.classComparison}
                        dataKey="value"
                        xKey="category"
                        useItemFill
                        showLabel
                        barSize={52}
                        height={260}
                        layout="vertical"
                    />
                </ChartCard>

                <ChartCard
                    title="Subject Rank"
                    subtitle="Your standing per subject in class"
                    icon={Trophy}
                    delay={0.35}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <SubjectRankTable data={data.subjectRanks} />
                </ChartCard>
            </div>

            {/* Row 4: Internal Trend (full width) */}
            <ChartCard
                title="Internal Performance Trend"
                subtitle="Score progression from Quiz 1 → Quiz 2 → Mid Sem"
                icon={TrendingUp}
                delay={0.4}
                className="hover:scale-[1.005] transition-transform"
                action={<ExportButton data={data.internalTrend} filename="internal-trend" />}
            >
                <AnimatedLineChart
                    data={data.internalTrend}
                    dataKeys={[
                        { key: "score",    color: "#3D8528", name: "Your Score"  },
                        { key: "classAvg", color: "#3B82F6", name: "Class Avg"   },
                    ]}
                    xKey="event"
                    height={240}
                    yDomain={[40, 100]}
                />
            </ChartCard>

            {/* Row 5: Attendance Impact + Performance Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Attendance vs Marks"
                    subtitle="Subject-wise correlation of attendance to score"
                    icon={Activity}
                    delay={0.45}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <div className="space-y-3">
                        {data.attendanceData.map((row, i) => (
                            <motion.div
                                key={row.subject}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.06 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-28 text-xs font-bold text-[#1C1C1A]/60 truncate shrink-0">{row.subject}</div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-[10px] text-[#1C1C1A]/30 font-bold">
                                        <span>Attend: {row.attendance}%</span>
                                        <span>Marks: {row.marks}%</span>
                                    </div>
                                    <div className="relative h-2 bg-[#F4F2EB] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${row.attendance}%` }}
                                            transition={{ delay: 0.55 + i * 0.06, duration: 0.7 }}
                                            className="absolute inset-y-0 left-0 bg-blue-400/40 rounded-full"
                                        />
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${row.marks}%` }}
                                            transition={{ delay: 0.6 + i * 0.06, duration: 0.7 }}
                                            className="absolute inset-y-0 left-0 bg-brand-green/60 rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-blue-400/40" /><span className="text-[10px] font-bold text-[#1C1C1A]/30">Attendance</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-brand-green/60" /><span className="text-[10px] font-bold text-[#1C1C1A]/30">Marks</span></div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Class Performance Distribution"
                    subtitle="How scores are spread across your batch"
                    icon={BarChart3}
                    delay={0.5}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <AnimatedBarChart
                        data={data.performanceDistribution}
                        dataKey="count"
                        xKey="range"
                        useItemFill
                        barSize={36}
                        height={260}
                    />
                    <p className="text-[10px] text-[#1C1C1A]/30 mt-3 font-bold">Your score ({data.internalScore}%) falls in the highlighted band</p>
                </ChartCard>
            </div>

            {/* Prediction Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    {...fadeUp(0.55)}
                    className="md:col-span-2 bg-linear-to-br from-brand-green/8 via-transparent to-blue-500/5 border border-brand-green/10 rounded-4xl p-6 flex items-center gap-6"
                >
                    <div className="w-14 h-14 rounded-2xl bg-brand-green/15 flex items-center justify-center shrink-0">
                        <Sparkles size={24} className="text-brand-green" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-brand-green/60 mb-1">Grade Prediction</div>
                        <div className="text-2xl font-serif font-bold text-[#1C1C1A]">
                            Predicted Grade: <span className="text-brand-green">{data.predictedGrade}</span>
                            <span className="text-lg text-[#1C1C1A]/30 ml-3">SGPA ~{data.predictedSGPA}</span>
                        </div>
                        <p className="text-xs text-[#1C1C1A]/40 mt-1">Based on current internal performance trajectory</p>
                    </div>
                </motion.div>
                <motion.div
                    {...fadeUp(0.6)}
                    className="relative overflow-hidden bg-[#1C1C1A] rounded-4xl p-6 flex flex-col justify-between"
                >
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Score Gap to Topper</div>
                    <div className="text-4xl font-serif font-bold text-white">
                        {(data.classComparison[2]?.value - data.internalScore).toFixed(1)}
                        <span className="text-lg text-white/30">%</span>
                    </div>
                    <div className="text-xs text-white/30 mt-2">Topper at {data.classComparison[2]?.value}%</div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-green/10 rounded-full blur-2xl" />
                </motion.div>
            </div>

            {/* Insights */}
            <SmartInsight insights={data.insights} delay={0.65} />
        </motion.div>
    );
}

// ── OVERALL ANALYTICS VIEW ────────────────────────────────────────────────────
function OverallView({ data }: { data: typeof studentOverallMockData }) {
    return (
        <motion.div key="overall" {...fadeUp(0)} className="space-y-8">

            {/* Hero KPI */}
            <HeroKPI label="OVERALL ANALYTICS — FINAL RESULTS DASHBOARD" glowColor="#3B82F6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                    <div>
                        <div className="text-4xl font-serif font-bold text-brand-green">
                            <StatsCounter value={data.sgpa} decimals={1} />
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">Current SGPA</div>
                    </div>
                    <div>
                        <div className="text-3xl font-serif font-bold text-white">
                            <StatsCounter value={data.cgpa} decimals={2} />
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">CGPA</div>
                    </div>
                    <div>
                        <div className="text-3xl font-serif font-bold text-white">
                            {data.rank}<span className="text-lg font-sans text-white/25"> / {data.totalStudents}</span>
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">Class Rank</div>
                    </div>
                    <div>
                        <div className={cn("text-3xl font-serif font-bold", data.backlogs.active > 0 ? "text-red-400" : "text-brand-green")}>
                            <StatsCounter value={data.backlogs.active} />
                        </div>
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">Active Backlogs</div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <StatusBadge status={data.passStatus} />
                        <div className="text-[10px] font-black text-white/35 uppercase tracking-widest">Result</div>
                    </div>
                </div>
            </HeroKPI>

            {/* Row 1: SGPA Trend + Subject Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="SGPA Trend"
                    subtitle="Semester-wise GPA vs class average"
                    icon={TrendingUp}
                    delay={0.1}
                    className="hover:scale-[1.01] transition-transform"
                    action={<ExportButton data={data.sgpaTrend} filename="sgpa-trend" />}
                >
                    <AnimatedLineChart
                        data={data.sgpaTrend}
                        dataKeys={[
                            { key: "sgpa",     color: "#3D8528", name: "Your SGPA"  },
                            { key: "classAvg", color: "#3B82F6", name: "Class Avg"  },
                        ]}
                        xKey="semester"
                        height={260}
                        yDomain={[5, 10]}
                    />
                </ChartCard>

                <ChartCard
                    title="Subject Final Performance"
                    subtitle="Marks obtained per subject this semester"
                    icon={BarChart3}
                    delay={0.15}
                    className="hover:scale-[1.01] transition-transform"
                    action={<ExportButton data={data.subjectPerformance} filename="subject-performance" />}
                >
                    <div className="space-y-3">
                        {data.subjectPerformance.map((row, i) => {
                            const gradeColor: Record<string, string> = {
                                O: "#10B981", "A+": "#3D8528", A: "#3D8528", "B+": "#3B82F6", B: "#8B5CF6", F: "#EF4444",
                            };
                            const gc = gradeColor[row.grade] ?? "#3B82F6";
                            return (
                                <motion.div
                                    key={row.subject}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.07 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="text-xs font-bold text-[#1C1C1A]/60 w-20 shrink-0 truncate">{row.subject}</div>
                                    <div className="flex-1">
                                        <div className="h-2 bg-[#F4F2EB] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${row.marks}%` }}
                                                transition={{ delay: 0.25 + i * 0.07, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                                                className="h-full rounded-full"
                                                style={{ background: gc }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-bold text-[#1C1C1A]">{row.marks}%</span>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg" style={{ background: `${gc}20`, color: gc }}>{row.grade}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </ChartCard>
            </div>

            {/* Row 2: Internal vs External (full width) */}
            <ChartCard
                title="Internal vs External — Subject Breakdown"
                subtitle="Compare your internal and external component scores per subject"
                icon={Activity}
                delay={0.2}
                className="hover:scale-[1.005] transition-transform"
                action={<ExportButton data={data.internalVsExternal} filename="int-vs-ext" />}
            >
                <GroupedBarChart
                    data={data.internalVsExternal}
                    xKey="subject"
                    bars={[
                        { key: "internal", name: "Internal (out of 50)", color: "#3D8528" },
                        { key: "external", name: "External (out of 50)", color: "#3B82F6" },
                    ]}
                    height={280}
                    barSize={20}
                />
            </ChartCard>

            {/* Row 3: CO Final Attainment + CO Gap Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Final CO Attainment"
                    subtitle="Course Outcome achievement — you vs class"
                    icon={Network}
                    delay={0.25}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <CoRadarChart
                        data={data.coFinalAttainment}
                        keys={[
                            { key: "student",  color: "#3D8528", name: "You"          },
                            { key: "classAvg", color: "#3B82F6", name: "Class Average" },
                        ]}
                        height={280}
                    />
                </ChartCard>

                <ChartCard
                    title="CO Gap Analysis"
                    subtitle="Your attainment vs class average per outcome"
                    icon={Target}
                    delay={0.3}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <div className="space-y-4">
                        {data.coFinalAttainment.map((row, i) => {
                            const gap = row.student - row.classAvg;
                            return (
                                <motion.div
                                    key={row.co}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08 }}
                                >
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-black text-[#1C1C1A]">{row.co}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[#1C1C1A]/40">Avg: {row.classAvg}%</span>
                                            <span className={cn("text-xs font-bold flex items-center gap-0.5", gap >= 0 ? "text-brand-green" : "text-red-500")}>
                                                {gap >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                                                {Math.abs(gap)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative h-2.5 bg-[#F4F2EB] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${row.classAvg}%` }}
                                            transition={{ delay: 0.35 + i * 0.08, duration: 0.7 }}
                                            className="absolute inset-y-0 left-0 bg-blue-400/25 rounded-full"
                                        />
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${row.student}%` }}
                                            transition={{ delay: 0.4 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                            className={cn("absolute inset-y-0 left-0 rounded-full", gap >= 0 ? "bg-brand-green/70" : "bg-red-400/60")}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </ChartCard>
            </div>

            {/* Row 4: Grade Distribution + Backlog Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Grade Distribution"
                    subtitle="Your grades across all subjects"
                    icon={Award}
                    delay={0.35}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <AnimatedBarChart
                        data={data.gradeDistribution}
                        dataKey="count"
                        xKey="grade"
                        useItemFill
                        showLabel
                        barSize={40}
                        height={240}
                    />
                </ChartCard>

                <ChartCard
                    title="Backlog Analysis"
                    subtitle="Active and cleared backlogs"
                    icon={BookOpen}
                    delay={0.4}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 text-center">
                            <div className="text-4xl font-serif font-bold text-red-500">
                                <StatsCounter value={data.backlogs.active} />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-1">Active</div>
                        </div>
                        <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-5 text-center">
                            <div className="text-4xl font-serif font-bold text-brand-green">
                                <StatsCounter value={data.backlogs.cleared} />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-1">Cleared</div>
                        </div>
                    </div>
                    {data.backlogHistory.length > 0 && (
                        <div className="space-y-2">
                            {data.backlogHistory.map((b, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.07 }}
                                    className={cn(
                                        "flex items-center justify-between p-3.5 rounded-2xl border",
                                        b.status === "CLEARED"
                                            ? "bg-brand-green/5 border-brand-green/10"
                                            : "bg-red-50/50 border-red-100"
                                    )}
                                >
                                    <div>
                                        <p className="text-xs font-bold text-[#1C1C1A]">{b.subject}</p>
                                        <p className="text-[10px] text-[#1C1C1A]/40">{b.semester} · {b.attempts} attempt{b.attempts > 1 ? "s" : ""}</p>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black px-2.5 py-1 rounded-lg",
                                        b.status === "CLEARED" ? "bg-brand-green/10 text-brand-green" : "bg-red-100 text-red-500"
                                    )}>{b.status}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Row 5: Percentile Gauge + Year-wise CGPA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Position in Class"
                    subtitle="Percentile ranking among batch"
                    icon={GaugeIcon}
                    delay={0.45}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <div className="flex flex-col items-center">
                        <GaugeChart
                            value={data.percentile}
                            label={`${data.percentile}%`}
                            sublabel="Percentile"
                            height={200}
                        />
                        <div className="flex items-center gap-6 mt-2">
                            <div className="text-center">
                                <div className="text-2xl font-serif font-bold text-brand-green">#{data.rank}</div>
                                <div className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest">Rank</div>
                            </div>
                            <div className="w-px h-10 bg-[#1C1C1A]/10" />
                            <div className="text-center">
                                <div className="text-2xl font-serif font-bold text-[#1C1C1A]">{data.totalStudents}</div>
                                <div className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest">Total Students</div>
                            </div>
                            <div className="w-px h-10 bg-[#1C1C1A]/10" />
                            <div className="text-center">
                                <div className="text-2xl font-serif font-bold text-blue-500">
                                    Top {(100 - data.percentile).toFixed(0)}%
                                </div>
                                <div className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest">Standing</div>
                            </div>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Year-wise CGPA Progression"
                    subtitle="Your CGPA vs class average per academic year"
                    icon={LineIcon}
                    delay={0.5}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <AnimatedLineChart
                        data={data.yearWiseCGPA}
                        dataKeys={[
                            { key: "cgpa",    color: "#3D8528", name: "Your CGPA"  },
                            { key: "avgCGPA", color: "#3B82F6", name: "Class Avg"  },
                        ]}
                        xKey="year"
                        height={220}
                        yDomain={[5, 10]}
                    />
                </ChartCard>
            </div>

            {/* Row 6: Peer Comparison (full width) */}
            <ChartCard
                title="Peer Comparison"
                subtitle="Your SGPA vs class average and topper across all semesters"
                icon={Users}
                delay={0.55}
                className="hover:scale-[1.005] transition-transform"
                action={<ExportButton data={data.peerComparison} filename="peer-comparison" />}
            >
                <AnimatedLineChart
                    data={data.peerComparison}
                    dataKeys={[
                        { key: "you",      color: "#3D8528", name: "You"          },
                        { key: "classAvg", color: "#3B82F6", name: "Class Average" },
                        { key: "topper",   color: "#8B5CF6", name: "Topper"       },
                    ]}
                    xKey="semester"
                    height={260}
                    yDomain={[5, 10]}
                    showArea={false}
                />
            </ChartCard>

            {/* Row 7: Heatmap + Risk Index */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartCard
                        title="Performance Heatmap"
                        subtitle="Subject scores per semester — Green = Strong, Red = Weak"
                        icon={Map}
                        delay={0.6}
                        className="hover:scale-[1.005] transition-transform"
                    >
                        <PerformanceHeatmap data={data.performanceHeatmap} />
                    </ChartCard>
                </div>

                <ChartCard
                    title="Risk Index"
                    subtitle="Academic risk based on CGPA, backlogs & trend"
                    icon={Brain}
                    delay={0.65}
                    className="hover:scale-[1.01] transition-transform"
                >
                    <GaugeChart
                        value={data.riskIndex}
                        label={data.riskLevel}
                        sublabel={`Risk: ${data.riskIndex}/100`}
                        height={200}
                        invert
                    />
                    <div className="space-y-2 mt-4">
                        {[
                            { label: "CGPA",    ok: data.cgpa >= 6,          good: "≥6.0",    bad: "<6.0"  },
                            { label: "Backlogs", ok: data.backlogs.active === 0, good: "Clean", bad: `${data.backlogs.active} Active` },
                            { label: "Trend",   ok: data.sgpaTrend.length < 2 || data.sgpaTrend[data.sgpaTrend.length - 1]?.sgpa >= (data.sgpaTrend[data.sgpaTrend.length - 2]?.sgpa ?? 0),
                                good: "Improving", bad: "Declining" },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#1C1C1A]/50">{item.label}</span>
                                <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg", item.ok ? "bg-brand-green/10 text-brand-green" : "bg-red-50 text-red-500")}>
                                    {item.ok ? item.good : item.bad}
                                </span>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            {/* Insights */}
            <SmartInsight insights={data.insights} delay={0.7} />
        </motion.div>
    );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { use } from "react";

export default function StudentAnalyticsPage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = use(params);
    const router = useRouter();
    const [studentName, setStudentName] = useState<string>("Student");
    const [studentDetails, setStudentDetails] = useState<string>("");

    useEffect(() => {
        api.get(`/api/v1/user/${studentId}`).then(data => {
            setStudentName(data.fullName);
            if (data.rollNumber && data.batch?.name) {
                setStudentDetails(`${data.rollNumber} • ${data.batch.name} • ${data.batch.branch?.name}`);
            }
        }).catch(console.error);
    }, [studentId]);

    const [activeTab, setActiveTab] = useState<"internal" | "overall">("internal");
    const [dataSource, setDataSource] = useState<"mock" | "live">("mock");
    const [liveInternal, setLiveInternal] = useState<any>(null);
    const [liveOverall, setLiveOverall] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [liveError, setLiveError] = useState(false);

    useEffect(() => {
        if (dataSource !== "live") return;
        setLiveError(false);
        setLoading(true);

        if (activeTab === "internal") {
            api.get(`/api/v1/analytics/student/internal?studentId=${studentId}`)
                .then(d => setLiveInternal(d))
                .catch(() => setLiveError(true))
                .finally(() => setLoading(false));
        } else {
            Promise.all([
                api.get(`/api/v1/analytics/student/personal?studentId=${studentId}`),
                api.get(`/api/v1/analytics/student/comparison?studentId=${studentId}`),
                api.get(`/api/v1/analytics/student/backlogs?studentId=${studentId}`),
                api.get(`/api/v1/analytics/student/overall-detail?studentId=${studentId}`),
            ])
                .then(([personal, comparison, backlogsData, detail]) => {
                    setLiveOverall({
                        ...studentOverallMockData,
                        sgpaTrend:         personal.sgpaTrend        ?? studentOverallMockData.sgpaTrend,
                        subjectPerformance: personal.subjectPerformance ?? studentOverallMockData.subjectPerformance,
                        rank:               comparison.rank           ?? studentOverallMockData.rank,
                        totalStudents:      comparison.totalStudents  ?? studentOverallMockData.totalStudents,
                        percentile:         comparison.percentile     ?? studentOverallMockData.percentile,
                        backlogs:           { active: backlogsData.active ?? 0, cleared: backlogsData.cleared ?? 0 },
                        backlogHistory:     backlogsData.history      ?? [],
                        internalVsExternal: detail.internalVsExternal ?? studentOverallMockData.internalVsExternal,
                        peerComparison:     detail.peerComparison     ?? studentOverallMockData.peerComparison,
                        gradeDistribution:  detail.gradeDistribution  ?? studentOverallMockData.gradeDistribution,
                        riskIndex:          detail.riskIndex          ?? studentOverallMockData.riskIndex,
                        riskLevel:          detail.riskLevel          ?? studentOverallMockData.riskLevel,
                        insights:           [...(personal.insights ?? []), ...(detail.insights ?? [])],
                    });
                })
                .catch(() => setLiveError(true))
                .finally(() => setLoading(false));
        }
    }, [dataSource, activeTab]);

    const internalData = dataSource === "mock" ? studentInternalMockData : (liveInternal ?? studentInternalMockData);
    const overallData  = dataSource === "mock" ? studentOverallMockData  : (liveOverall  ?? studentOverallMockData);

    const tabs = [
        { id: "internal", label: "Internal Analytics",  sub: "Semester tracking",  icon: FlaskConical },
        { id: "overall",  label: "Overall Analytics",   sub: "Final results",      icon: GraduationCap },
    ] as const;

    return (
        <div className="space-y-8 pb-16">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button 
                        onClick={() => router.push('/dashboard/analytics/student')}
                        className="flex items-center gap-2 text-[#1C1C1A]/40 hover:text-[#1C1C1A] text-xs font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Students
                    </button>
                    <div className="flex items-center gap-2 text-brand-green text-[10px] font-black tracking-[0.2em] uppercase mb-2">
                        <GraduationCap size={13} /> {studentName}'s Analytics
                    </div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">{studentName}</h1>
                    <p className="text-[#1C1C1A]/40 text-sm mt-1 font-mono">
                        {studentDetails || "Loading student details..."}
                    </p>
                </div>

                {/* Mock / Live toggle */}
                <div className="flex items-center gap-1.5 bg-[#F4F2EB] rounded-full p-1 self-start md:self-auto">
                    {(["mock", "live"] as const).map(src => (
                        <button
                            key={src}
                            onClick={() => setDataSource(src)}
                            className={cn(
                                "relative px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                dataSource === src
                                    ? src === "mock"
                                        ? "bg-[#1C1C1A] text-white shadow-lg"
                                        : "bg-brand-green text-white shadow-lg shadow-brand-green/30"
                                    : "text-[#1C1C1A]/40 hover:text-[#1C1C1A]"
                            )}
                        >
                            {src === "live" && <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle", dataSource === "live" ? "bg-white animate-pulse" : "bg-[#1C1C1A]/20")} />}
                            {src}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Main Tab Navigation ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 bg-[#F4F2EB] rounded-2xl p-1.5 gap-1.5">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center justify-center gap-3 py-3.5 rounded-xl transition-all duration-300 group",
                                isActive ? "bg-[#1C1C1A] shadow-xl" : "hover:bg-[#1C1C1A]/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl bg-linear-to-br from-brand-green/5 via-transparent to-blue-500/5 pointer-events-none" />
                            )}
                            <Icon
                                size={17}
                                className={cn(
                                    "relative z-10 transition-colors",
                                    isActive ? "text-brand-green" : "text-[#1C1C1A]/30 group-hover:text-[#1C1C1A]/60"
                                )}
                            />
                            <div className="relative z-10 text-left">
                                <div className={cn("text-sm font-bold leading-none", isActive ? "text-white" : "text-[#1C1C1A]/50")}>
                                    {tab.label}
                                </div>
                                <div className={cn("text-[10px] mt-0.5 font-semibold", isActive ? "text-white/30" : "text-[#1C1C1A]/25")}>
                                    {tab.sub}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Loading / Error states ───────────────────────────────────── */}
            {dataSource === "live" && loading && (
                <div className="flex items-center justify-center py-28">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-brand-green" size={32} />
                        <p className="text-sm font-bold text-[#1C1C1A]/30 uppercase tracking-widest">Loading live data…</p>
                    </div>
                </div>
            )}

            {dataSource === "live" && liveError && !loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-3">
                        <AlertTriangle size={40} className="mx-auto text-amber-400" />
                        <p className="text-base font-bold text-[#1C1C1A]/50">Live data unavailable.</p>
                        <p className="text-xs text-[#1C1C1A]/30">Switch to <span className="font-bold">Mock</span> to preview charts.</p>
                    </div>
                </div>
            )}

            {/* ── Tab Content ──────────────────────────────────────────────── */}
            {(!loading) && (
                <AnimatePresence mode="wait">
                    {activeTab === "internal" ? (
                        <InternalView key="internal" data={internalData} />
                    ) : (
                        <OverallView key="overall" data={overallData} />
                    )}
                </AnimatePresence>
            )}

            <div className="pt-2 text-center text-[10px] text-[#1C1C1A]/15 font-sans tracking-[0.3em] uppercase">
                Evalis Student Analytics · Intelligence v3.0
            </div>
        </div>
    );
}
