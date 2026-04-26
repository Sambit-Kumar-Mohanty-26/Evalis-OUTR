"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Loader2, Bell, AlertTriangle, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-3xl p-6 border border-[#1C1C1A]/5 shadow-sm`}>
            <div className={`text-xs font-black uppercase tracking-widest mb-3 ${color}`}>{label}</div>
            <div className="text-4xl font-serif font-bold text-[#1C1C1A]">{value}</div>
            {sub && <div className="text-xs text-[#1C1C1A]/40 mt-1">{sub}</div>}
        </motion.div>
    );
}

export default function HOSOverview() {
    const [overview, setOverview] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/api/v1/dashboard/hos/overview').then(d => setOverview(d)),
            api.get('/api/v1/dashboard/hos/alerts').then(d => setAlerts(d.alerts || [])),
        ]).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><GraduationCap size={14} /> Head of School</div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">{overview?.schoolName || 'School Dashboard'}</h1>
                    <p className="text-[#1C1C1A]/40 mt-1">Academic performance overview for your school</p>
                </div>
                {alerts.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-2xl">
                        <Bell size={16} className="text-red-500" />
                        <span className="text-sm font-bold text-red-500">{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {overview && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <KpiCard label="Total Students" value={String(overview.totalStudents)} color="text-blue-500" />
                        <KpiCard label="Branches" value={String(overview.totalBranches)} color="text-purple-500" />
                        <KpiCard label="Avg CGPA" value={String(overview.avgCGPA)} sub="Cumulative" color="text-brand-green" />
                        <KpiCard label="Pass Rate" value={`${overview.passPercent}%`} color="text-emerald-500" />
                        <KpiCard label="Backlog Rate" value={`${overview.backlogPercent}%`} color="text-red-500" />
                    </div>
                    {alerts.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-serif text-[#1C1C1A]">Critical Alerts</h2>
                            {alerts.map((alert, i) => (
                                <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${alert.severity === 'ERROR' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <AlertTriangle size={18} className={alert.severity === 'ERROR' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
                                    <p className={`text-sm font-medium ${alert.severity === 'ERROR' ? 'text-red-700' : 'text-amber-700'}`}>{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
