"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    GraduationCap, Loader2, Bell, AlertTriangle, 
    Users, BookOpen, ShieldCheck, UserPlus, 
    ChevronRight, Search, X, Trash2, RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";
import { BranchPerformanceChart } from "./BranchPerformanceChart";
import Link from "next/link";
import { toast } from "sonner";

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
    const [branches, setBranches] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showAdvisorModal, setShowAdvisorModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<any>(null);
    const [teacherSearch, setTeacherSearch] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ov, br, al, tc] = await Promise.all([
                api.get('/api/v1/dashboard/hos/overview'),
                api.get('/api/v1/dashboard/hos/branches'),
                api.get('/api/v1/dashboard/hos/alerts'),
                api.get('/api/v1/dashboard/hos/teachers'),
            ]);
            setOverview(ov);
            setBranches(br.branches || []);
            setAlerts(al.alerts || []);
            setTeachers(tc.teachers || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignAdvisor = async (teacherId: string) => {
        if (!selectedBranch) return;
        setUpdating(true);
        try {
            await api.post('/api/v1/dashboard/hos/assign-advisor', {
                branchId: selectedBranch.branchId,
                teacherId
            });
            toast.success("Advisor assigned successfully");
            setShowAdvisorModal(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to assign advisor");
        } finally {
            setUpdating(false);
        }
    };

    const handleRevokeAdvisor = async (branchId: string) => {
        if (!confirm("Are you sure you want to revoke this advisor's access?")) return;
        setUpdating(true);
        try {
            await api.post(`/api/v1/dashboard/hos/branches/${branchId}/revoke-advisor`);
            toast.success("Advisor access revoked successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to revoke advisor");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    const filteredTeachers = teachers.filter(t => 
        t.fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><GraduationCap size={14} /> {overview?.hosName || 'Head of School'}</div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">{overview?.schoolName || 'School Dashboard'}</h1>
                    <p className="text-[#1C1C1A]/40 mt-1">Institutional performance overview and faculty management</p>
                </div>
                <div className="flex items-center gap-3">
                    {alerts.length > 0 && (
                        <Link href="/dashboard/hos/analytics" className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors">
                            <Bell size={16} className="text-red-500" />
                            <span className="text-sm font-bold text-red-500">{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard label="Total Students" value={String(overview?.totalStudents || 0)} color="text-blue-500" />
                <KpiCard label="Branches" value={String(overview?.totalBranches || 0)} color="text-purple-500" />
                <KpiCard label="Avg CGPA" value={String(overview?.avgCGPA || 0)} sub="Cumulative" color="text-brand-green" />
                <KpiCard label="Pass Rate" value={`${overview?.passPercent || 0}%`} color="text-emerald-500" />
                <KpiCard label="Backlog Rate" value={`${overview?.backlogPercent || 0}%`} color="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Analytics & Alerts */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Chart */}
                    <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-serif text-[#1C1C1A]">Branch Performance</h3>
                                <p className="text-sm text-[#1C1C1A]/40">Comparative pass rates across departments</p>
                            </div>
                        </div>
                        <BranchPerformanceChart data={branches} />
                    </div>

                    {/* Alerts moved to Analytics Tab */}
                </div>

                {/* Right Column: Staffing & Quick Links */}
                <div className="space-y-8">
                    {/* Staffing & Advisors */}
                    <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 p-6 shadow-sm">
                        <h3 className="text-lg font-serif text-[#1C1C1A] mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-brand-green" size={20} /> Branch Advisors
                        </h3>
                        <div className="space-y-4">
                            {branches.map((branch) => (
                                <div key={branch.branchId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                            {branch.branchName[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-[#1C1C1A]">{branch.branchName}</div>
                                            <div className="text-xs text-[#1C1C1A]/40">
                                                {branch.advisor ? (
                                                    <span className="text-brand-green font-medium">Advisor: {branch.advisor.fullName}</span>
                                                ) : (
                                                    <span className="text-red-400">No Advisor Assigned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {branch.advisor ? (
                                            <>
                                                <button 
                                                    onClick={() => { setSelectedBranch(branch); setShowAdvisorModal(true); }}
                                                    className="p-2 transition-colors bg-white shadow-sm border border-gray-100 rounded-lg text-blue-500 hover:bg-blue-500 hover:text-white"
                                                    title="Change Advisor"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleRevokeAdvisor(branch.branchId)}
                                                    className="p-2 transition-colors bg-white shadow-sm border border-gray-100 rounded-lg text-red-500 hover:bg-red-500 hover:text-white"
                                                    title="Revoke Access"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => { setSelectedBranch(branch); setShowAdvisorModal(true); }}
                                                className="p-2 transition-colors bg-white shadow-sm border border-brand-green/20 rounded-lg text-brand-green hover:bg-brand-green hover:text-white"
                                                title="Assign Advisor"
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* At-Risk Widget */}
                    <div className="bg-[#1C1C1A] rounded-3xl p-6 text-white shadow-xl">
                        <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                            <Users size={20} className="text-red-400" /> Academic Risk
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-2xl font-serif font-bold text-red-400">{overview?.backlogPercent}%</div>
                                <div className="text-xs text-white/40 uppercase tracking-widest mt-1">Students with Backlogs</div>
                            </div>
                            <Link href="/dashboard/hos/branches" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                                <div className="text-sm font-medium">View Detailed Roster</div>
                                <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advisor Selection Modal */}
            <AnimatePresence>
                {showAdvisorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#1C1C1A]/60 backdrop-blur-sm"
                            onClick={() => setShowAdvisorModal(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-serif text-[#1C1C1A]">Assign Branch Advisor</h3>
                                    <p className="text-sm text-[#1C1C1A]/40">Selecting faculty for {selectedBranch?.branchName}</p>
                                </div>
                                <button onClick={() => setShowAdvisorModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or email..." 
                                        value={teacherSearch}
                                        onChange={(e) => setTeacherSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                                    />
                                </div>

                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {filteredTeachers.length > 0 ? (
                                        filteredTeachers.map((teacher) => (
                                            <button
                                                key={teacher.id}
                                                disabled={updating}
                                                onClick={() => handleAssignAdvisor(teacher.id)}
                                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-brand-green/5 border border-transparent hover:border-brand-green/20 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold">
                                                        {teacher.fullName[0]}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-[#1C1C1A]">{teacher.fullName}</div>
                                                        <div className="text-xs text-[#1C1C1A]/40">{teacher.email}</div>
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-brand-green group-hover:text-white transition-colors">
                                                    {updating ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <BookOpen size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No teachers found in this school hierarchy</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
