"use client";

import { useState, useEffect } from "react";
import { BookOpen, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from "@/lib/api";

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#1C1C1A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-50">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">{data.code}</p>
                <p className="text-lg font-serif text-white mb-2">{data.name}</p>
                <div className="flex gap-4">
                    <div>
                        <p className="text-[10px] uppercase text-white/40">Pass</p>
                        <p className="text-sm font-bold text-emerald-400">{data.passPercent}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-white/40">Fail</p>
                        <p className="text-sm font-bold text-red-400">{data.failPercent}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-white/40">Students</p>
                        <p className="text-sm font-bold text-white">{data.total}</p>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function HOSSubjects() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/hos/subjects')
            .then(d => setSubjects(d.subjects || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    const highRiskSubjects = subjects.filter(s => s.isHighRisk);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Subject Analysis</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Identify academic risks and challenging subjects across the school</p>
            </div>

            {subjects.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                    <BookOpen size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                    <p className="text-lg font-serif text-[#1C1C1A]/60">No subject analysis available yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Cinematic Chart */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] p-8 border border-[#1C1C1A]/5 shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/5 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                        <h2 className="text-xl font-serif text-[#1C1C1A] mb-6">Performance Matrix</h2>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" dataKey="passPercent" name="Pass Rate" unit="%" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <YAxis type="number" dataKey="failPercent" name="Fail Rate" unit="%" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <ZAxis type="number" dataKey="total" range={[100, 1000]} name="Students" />
                                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                    <Scatter name="Subjects" data={subjects} animationDuration={1500}>
                                        {subjects.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isHighRisk ? '#EF4444' : '#10B981'} opacity={0.7} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4 text-xs font-bold uppercase tracking-widest text-[#1C1C1A]/40">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 opacity-70" /> Stable Subject</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 opacity-70" /> High Risk Subject</div>
                            <div className="flex items-center gap-2 text-brand-green ml-4">Bubble size = Total Students</div>
                        </div>
                    </motion.div>

                    {/* Risk Cards */}
                    <div>
                        <h2 className="text-2xl font-serif text-[#1C1C1A] mb-6 flex items-center gap-2">
                            {highRiskSubjects.length > 0 ? <AlertTriangle className="text-red-500" /> : <ShieldCheck className="text-brand-green" />}
                            {highRiskSubjects.length > 0 ? 'High Risk Subjects' : 'All Subjects Stable'}
                        </h2>
                        
                        {highRiskSubjects.length > 0 && (
                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {highRiskSubjects.map(s => (
                                    <motion.div 
                                        key={s.subjectId} 
                                        variants={cardVariants}
                                        whileHover={{ y: -5 }}
                                        className="relative bg-[#1C1C1A] rounded-[2rem] p-6 shadow-2xl overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 rounded-full blur-[30px] group-hover:bg-red-500/40 transition-colors" />
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">{s.code}</p>
                                                    <h3 className="text-xl font-serif text-white">{s.name}</h3>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20">
                                                    <AlertTriangle size={18} />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                    <p className="text-[10px] uppercase text-white/40 tracking-widest">Failure Rate</p>
                                                    <p className="text-2xl font-serif font-bold text-red-400">{s.failPercent}%</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                    <p className="text-[10px] uppercase text-white/40 tracking-widest">Students</p>
                                                    <p className="text-2xl font-serif font-bold text-white">{s.total}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
