"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList, Plus, Layers, FileText, PenLine, BarChart3,
    Loader2, Check, X, Lock, Unlock, AlertTriangle,
    GripVertical, Trash2, ChevronDown, BookOpen, Play
} from "lucide-react";
import { toast } from "sonner";

type Tab = 'schemas' | 'instances' | 'marks' | 'results';

interface ExamComponent {
    id?: string;
    name: string;
    maxMarks: number;
    category: string;
    order: number;
}

interface ExamSchema {
    id: string;
    name: string;
    type: string;
    totalMarks: number;
    components: ExamComponent[];
    _count: { subjects: number };
}

interface ExamInstance {
    id: string;
    name: string;
    type: string;
    status: string;
    semester: number;
    scheduledDate: string | null;
    batch: { id: string; name: string; currentSemester: number };
    _count: { marks: number; results: number };
}

export default function ExamsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('schemas');
    const [schemas, setSchemas] = useState<ExamSchema[]>([]);
    const [instances, setInstances] = useState<ExamInstance[]>([]);
    const [loading, setLoading] = useState(true);

    // Schema Builder
    const [showSchemaBuilder, setShowSchemaBuilder] = useState(false);
    const [schemaName, setSchemaName] = useState("");
    const [schemaType, setSchemaType] = useState("THEORY");
    const [schemaTotalMarks, setSchemaTotalMarks] = useState(100);
    const [schemaComponents, setSchemaComponents] = useState<ExamComponent[]>([
        { name: "Attendance", maxMarks: 5, category: "INTERNAL", order: 0 },
        { name: "Assignment", maxMarks: 10, category: "INTERNAL", order: 1 },
        { name: "Mid Semester", maxMarks: 25, category: "INTERNAL", order: 2 },
        { name: "End Semester", maxMarks: 60, category: "EXTERNAL", order: 3 },
    ]);

    // Instance Creator
    const [showInstanceCreator, setShowInstanceCreator] = useState(false);
    const [instanceName, setInstanceName] = useState("");
    const [instanceBatchId, setInstanceBatchId] = useState("");
    const [instanceSemester, setInstanceSemester] = useState(1);
    const [batches, setBatches] = useState<any[]>([]);

    const API = process.env.NEXT_PUBLIC_API_URL;

    const fetchSchemas = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/v1/exam/schemas`, { credentials: "include" });
            const data = await res.json();
            setSchemas(data.schemas || []);
        } catch { toast.error("Failed to load schemas"); }
    }, [API]);

    const fetchInstances = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/v1/exam/instances`, { credentials: "include" });
            const data = await res.json();
            setInstances(data.instances || []);
        } catch { toast.error("Failed to load exam instances"); }
    }, [API]);

    const fetchBatches = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/v1/batch`, { credentials: "include" });
            const data = await res.json();
            setBatches(data.batches || []);
        } catch {}
    }, [API]);

    useEffect(() => {
        Promise.all([fetchSchemas(), fetchInstances(), fetchBatches()]).finally(() => setLoading(false));
    }, [fetchSchemas, fetchInstances, fetchBatches]);

    const componentTotal = schemaComponents.reduce((sum, c) => sum + c.maxMarks, 0);
    const isValidTotal = componentTotal === schemaTotalMarks;

    const handleCreateSchema = async () => {
        if (!schemaName.trim()) { toast.error("Schema name is required"); return; }
        if (!isValidTotal) { toast.error(`Component total (${componentTotal}) must equal ${schemaTotalMarks}`); return; }
        try {
            const res = await fetch(`${API}/api/v1/exam/schemas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: schemaName,
                    type: schemaType,
                    totalMarks: schemaTotalMarks,
                    components: schemaComponents,
                }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            toast.success("Exam schema created!");
            setShowSchemaBuilder(false);
            setSchemaName("");
            fetchSchemas();
        } catch (err: any) {
            toast.error(err.message || "Failed to create schema");
        }
    };

    const handleCreateInstance = async () => {
        if (!instanceName.trim() || !instanceBatchId) { toast.error("Fill all fields"); return; }
        try {
            const res = await fetch(`${API}/api/v1/exam/instances`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: instanceName,
                    batchId: instanceBatchId,
                    semester: instanceSemester,
                }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            toast.success("Exam instance created!");
            setShowInstanceCreator(false);
            setInstanceName("");
            fetchInstances();
        } catch (err: any) {
            toast.error(err.message || "Failed to create instance");
        }
    };

    const handleStatusTransition = async (instanceId: string, newStatus: string) => {
        try {
            const res = await fetch(`${API}/api/v1/exam/instances/${instanceId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            toast.success(`Exam status updated to ${newStatus}`);
            fetchInstances();
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    };

    const handlePublishResults = async (instanceId: string) => {
        if (!confirm("Publish all results for this exam? This will make them visible to students.")) return;
        try {
            const res = await fetch(`${API}/api/v1/exam/instances/${instanceId}/publish`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            toast.success(data.message || "Results published!");
        } catch {
            toast.error("Failed to publish results");
        }
    };

    const handleCalculateResults = async (instanceId: string) => {
        try {
            const res = await fetch(`${API}/api/v1/exam/results/calculate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ examInstanceId: instanceId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${data.message} (${data.studentsProcessed} students processed)`);
            fetchInstances();
        } catch (err: any) {
            toast.error(err.message || "Failed to calculate results");
        }
    };

    const addComponent = () => {
        setSchemaComponents([...schemaComponents, { name: "", maxMarks: 0, category: "INTERNAL", order: schemaComponents.length }]);
    };

    const removeComponent = (index: number) => {
        setSchemaComponents(schemaComponents.filter((_, i) => i !== index));
    };

    const updateComponent = (index: number, field: string, value: any) => {
        const updated = [...schemaComponents];
        (updated[index] as any)[field] = field === 'maxMarks' ? parseInt(value) || 0 : value;
        setSchemaComponents(updated);
    };

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'schemas', label: 'Exam Schemas', icon: Layers },
        { key: 'instances', label: 'Exam Instances', icon: FileText },
        { key: 'marks', label: 'Marks Entry', icon: PenLine },
        { key: 'results', label: 'Results', icon: BarChart3 },
    ];

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
            ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            LOCKED: 'bg-amber-50 text-amber-600 border-amber-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-500';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-bold tracking-[0.2em] uppercase mb-2">
                        <ClipboardList size={14} /> Exam Evaluation Engine
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">Examinations</h1>
                    <p className="text-sm text-[#1C1C1A]/50 mt-1">Manage evaluation structures, assessments, and results</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-2xl p-1.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.key
                                ? 'bg-[#1C1C1A] text-white shadow-lg'
                                : 'text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-white/40'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-brand-green" size={32} />
                </div>
            ) : (
                <>
                    {/* ─── SCHEMAS TAB ─────────────────────────────────────────── */}
                    {activeTab === 'schemas' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowSchemaBuilder(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold hover:bg-[#2C2C2A] transition-colors shadow-lg"
                                >
                                    <Plus size={16} /> New Schema
                                </motion.button>
                            </div>

                            {schemas.length === 0 ? (
                                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-16 text-center">
                                    <Layers size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                                    <h3 className="text-lg font-bold text-[#1C1C1A]/60 mb-2">No Exam Schemas</h3>
                                    <p className="text-sm text-[#1C1C1A]/40">Create evaluation templates to define how subjects are graded.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {schemas.map((schema) => (
                                        <motion.div
                                            key={schema.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white/70 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${schema.type === 'LAB' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                                        <BookOpen size={18} className={schema.type === 'LAB' ? 'text-purple-600' : 'text-blue-600'} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-[#1C1C1A]">{schema.name}</h3>
                                                        <div className="text-[10px] text-[#1C1C1A]/40 uppercase tracking-widest">{schema.type} • {schema.totalMarks} marks</div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-[#1C1C1A]/30 bg-[#F4F2EB] px-2 py-1 rounded-lg">
                                                    {schema._count?.subjects || 0} subjects
                                                </span>
                                            </div>

                                            <div className="space-y-1.5">
                                                {schema.components.map((comp) => (
                                                    <div key={comp.id} className="flex items-center justify-between bg-[#F4F2EB] rounded-xl px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${comp.category === 'EXTERNAL' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                            <span className="text-xs font-medium text-[#1C1C1A]">{comp.name}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-[#1C1C1A]/60">{comp.maxMarks}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── INSTANCES TAB ───────────────────────────────────────── */}
                    {activeTab === 'instances' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowInstanceCreator(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold hover:bg-[#2C2C2A] transition-colors shadow-lg"
                                >
                                    <Plus size={16} /> New Exam
                                </motion.button>
                            </div>

                            {instances.length === 0 ? (
                                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-16 text-center">
                                    <FileText size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                                    <h3 className="text-lg font-bold text-[#1C1C1A]/60 mb-2">No Exam Instances</h3>
                                    <p className="text-sm text-[#1C1C1A]/40">Create exam events to start evaluating students.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {instances.map((inst) => (
                                        <motion.div
                                            key={inst.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white/70 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${inst.type === 'BACK_PAPER' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                                        <FileText size={20} className={inst.type === 'BACK_PAPER' ? 'text-red-600' : 'text-blue-600'} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-[#1C1C1A]">{inst.name}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-[#1C1C1A]/40">{inst.batch?.name}</span>
                                                            <span className="text-[#1C1C1A]/10">•</span>
                                                            <span className="text-[10px] text-[#1C1C1A]/40">Sem {inst.semester}</span>
                                                            {inst.type === 'BACK_PAPER' && (
                                                                <>
                                                                    <span className="text-[#1C1C1A]/10">•</span>
                                                                    <span className="text-[10px] text-red-500 font-bold">BACK PAPER</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right mr-4">
                                                        <div className="text-[10px] text-[#1C1C1A]/30">Marks Entries</div>
                                                        <div className="text-sm font-bold text-[#1C1C1A]">{inst._count?.marks || 0}</div>
                                                    </div>

                                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${statusBadge(inst.status)}`}>
                                                        {inst.status}
                                                    </span>

                                                    {/* Status transition buttons */}
                                                    {inst.status === 'DRAFT' && (
                                                        <button
                                                            onClick={() => handleStatusTransition(inst.id, 'ACTIVE')}
                                                            className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                    {inst.status === 'ACTIVE' && (
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => handleCalculateResults(inst.id)}
                                                                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                                                            >
                                                                Calculate
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusTransition(inst.id, 'LOCKED')}
                                                                className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
                                                            >
                                                                Lock
                                                            </button>
                                                        </div>
                                                    )}
                                                    {inst.status === 'LOCKED' && (
                                                        <button
                                                            onClick={() => handlePublishResults(inst.id)}
                                                            className="px-3 py-1.5 text-xs font-bold text-white bg-brand-green rounded-xl hover:opacity-90 transition-colors"
                                                        >
                                                            Publish
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── MARKS TAB ───────────────────────────────────────────── */}
                    {activeTab === 'marks' && (
                        <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-12 text-center">
                            <PenLine size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                            <h3 className="text-lg font-bold text-[#1C1C1A]/60 mb-2">Marks Entry Portal</h3>
                            <p className="text-sm text-[#1C1C1A]/40 max-w-md mx-auto">
                                Teachers can enter marks by selecting an active exam instance and subject.
                                This view will be available when exam instances are in ACTIVE status.
                            </p>
                            {instances.filter(i => i.status === 'ACTIVE').length > 0 && (
                                <div className="mt-6 space-y-2">
                                    <div className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest">Active Exams</div>
                                    {instances.filter(i => i.status === 'ACTIVE').map(inst => (
                                        <div key={inst.id} className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold mr-2">
                                            <Play size={12} /> {inst.name} — Sem {inst.semester}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── RESULTS TAB ─────────────────────────────────────────── */}
                    {activeTab === 'results' && (
                        <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-12 text-center">
                            <BarChart3 size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                            <h3 className="text-lg font-bold text-[#1C1C1A]/60 mb-2">Results Dashboard</h3>
                            <p className="text-sm text-[#1C1C1A]/40 max-w-md mx-auto">
                                View published results, SGPA/CGPA calculations, and student performance analytics.
                                Results become visible here after an exam is LOCKED and published.
                            </p>
                            <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto">
                                <div className="bg-[#F4F2EB] rounded-xl p-4">
                                    <div className="text-2xl font-bold text-[#1C1C1A]">{instances.filter(i => i.status === 'LOCKED').length}</div>
                                    <div className="text-[10px] text-[#1C1C1A]/40 font-bold uppercase">Locked Exams</div>
                                </div>
                                <div className="bg-[#F4F2EB] rounded-xl p-4">
                                    <div className="text-2xl font-bold text-[#1C1C1A]">{instances.reduce((s, i) => s + (i._count?.results || 0), 0)}</div>
                                    <div className="text-[10px] text-[#1C1C1A]/40 font-bold uppercase">Total Results</div>
                                </div>
                                <div className="bg-[#F4F2EB] rounded-xl p-4">
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {/* Grading Scale */}
                                        O–F
                                    </div>
                                    <div className="text-[10px] text-[#1C1C1A]/40 font-bold uppercase">Grade Scale</div>
                                </div>
                            </div>

                            {/* Grading Reference */}
                            <div className="mt-8 max-w-md mx-auto">
                                <div className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-3">University Grading System</div>
                                <div className="grid grid-cols-7 gap-1">
                                    {[
                                        { g: 'O', p: '≥91', gp: 10, color: 'emerald' },
                                        { g: 'A', p: '81-90', gp: 9, color: 'green' },
                                        { g: 'B', p: '71-80', gp: 8, color: 'blue' },
                                        { g: 'C', p: '61-70', gp: 7, color: 'cyan' },
                                        { g: 'D', p: '51-60', gp: 6, color: 'yellow' },
                                        { g: 'P', p: '35-50', gp: 5, color: 'orange' },
                                        { g: 'F', p: '<35', gp: 2, color: 'red' },
                                    ].map(({ g, p, gp, color }) => (
                                        <div key={g} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-2 text-center`}>
                                            <div className={`text-lg font-bold text-${color}-600`}>{g}</div>
                                            <div className="text-[8px] text-[#1C1C1A]/40">{p}%</div>
                                            <div className="text-[10px] font-bold text-[#1C1C1A]/60">GP: {gp}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ─── SCHEMA BUILDER MODAL ─────────────────────────────────────────── */}
            <AnimatePresence>
                {showSchemaBuilder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowSchemaBuilder(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-[#1C1C1A]/5 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-[#1C1C1A] mb-6">Build Exam Schema</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Schema Name</label>
                                        <input
                                            value={schemaName}
                                            onChange={(e) => setSchemaName(e.target.value)}
                                            placeholder="e.g., Theory Evaluation"
                                            className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Type</label>
                                        <select
                                            value={schemaType}
                                            onChange={(e) => setSchemaType(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="THEORY">Theory</option>
                                            <option value="LAB">Lab</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Total Marks</label>
                                    <input
                                        type="number"
                                        value={schemaTotalMarks}
                                        onChange={(e) => setSchemaTotalMarks(parseInt(e.target.value) || 100)}
                                        className="w-24 px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                    />
                                </div>

                                {/* Components */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest">Components</label>
                                        <button onClick={addComponent} className="text-xs font-bold text-brand-green hover:text-emerald-700 flex items-center gap-1">
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {schemaComponents.map((comp, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-[#F4F2EB] rounded-xl p-3">
                                                <GripVertical size={14} className="text-[#1C1C1A]/20 cursor-grab" />
                                                <input
                                                    value={comp.name}
                                                    onChange={(e) => updateComponent(i, 'name', e.target.value)}
                                                    placeholder="Component name"
                                                    className="flex-1 px-3 py-2 rounded-lg border border-[#1C1C1A]/10 bg-white text-xs focus:outline-none focus:border-brand-green"
                                                />
                                                <input
                                                    type="number"
                                                    value={comp.maxMarks}
                                                    onChange={(e) => updateComponent(i, 'maxMarks', e.target.value)}
                                                    className="w-20 px-3 py-2 rounded-lg border border-[#1C1C1A]/10 bg-white text-xs text-center focus:outline-none focus:border-brand-green"
                                                />
                                                <select
                                                    value={comp.category}
                                                    onChange={(e) => updateComponent(i, 'category', e.target.value)}
                                                    className="w-28 px-2 py-2 rounded-lg border border-[#1C1C1A]/10 bg-white text-xs focus:outline-none focus:border-brand-green"
                                                >
                                                    <option value="INTERNAL">Internal</option>
                                                    <option value="EXTERNAL">External</option>
                                                </select>
                                                <button
                                                    onClick={() => removeComponent(i)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Validation */}
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${isValidTotal ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                        {isValidTotal ? <Check size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-red-600" />}
                                        <span className={`text-xs font-bold ${isValidTotal ? 'text-emerald-600' : 'text-red-600'}`}>
                                            Component Total: {componentTotal} / {schemaTotalMarks}
                                        </span>
                                    </div>
                                    {!isValidTotal && (
                                        <span className="text-[10px] text-red-500 font-bold">Must equal {schemaTotalMarks}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowSchemaBuilder(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-[#1C1C1A]/50 hover:text-[#1C1C1A] rounded-xl hover:bg-[#F4F2EB] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSchema}
                                    disabled={!isValidTotal || !schemaName.trim()}
                                    className="px-5 py-2.5 bg-[#1C1C1A] text-white text-sm font-bold rounded-xl hover:bg-[#2C2C2A] transition-colors disabled:opacity-50"
                                >
                                    Create Schema
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── INSTANCE CREATOR MODAL ───────────────────────────────────────── */}
            <AnimatePresence>
                {showInstanceCreator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowInstanceCreator(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-[#1C1C1A]/5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-[#1C1C1A] mb-6">Create Exam Instance</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Exam Name</label>
                                    <input
                                        value={instanceName}
                                        onChange={(e) => setInstanceName(e.target.value)}
                                        placeholder="e.g., Mid Semester Oct 2024"
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Batch</label>
                                    <select
                                        value={instanceBatchId}
                                        onChange={(e) => {
                                            setInstanceBatchId(e.target.value);
                                            const selected = batches.find((b: any) => b.id === e.target.value);
                                            if (selected) setInstanceSemester(selected.currentSemester);
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                    >
                                        <option value="">Select Batch</option>
                                        {batches.filter((b: any) => b.status === 'ONGOING').map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name} (Sem {b.currentSemester})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Semester</label>
                                    <input
                                        type="number"
                                        value={instanceSemester}
                                        onChange={(e) => setInstanceSemester(parseInt(e.target.value))}
                                        min={1}
                                        max={12}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowInstanceCreator(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-[#1C1C1A]/50 hover:text-[#1C1C1A] rounded-xl hover:bg-[#F4F2EB] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateInstance}
                                    disabled={!instanceName.trim() || !instanceBatchId}
                                    className="px-5 py-2.5 bg-[#1C1C1A] text-white text-sm font-bold rounded-xl hover:bg-[#2C2C2A] transition-colors disabled:opacity-50"
                                >
                                    Create Exam
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
