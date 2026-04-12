"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ArrowRight, Loader2, CheckCircle2, Building2,
    Plus, Sparkles, School, GraduationCap, Users,
    ChevronLeft, LayoutGrid, Globe, Settings2,
    PieChart, X
} from "lucide-react";
import { EvalisLogo } from "@/components/ui/EvalisLogo";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { StardustBackground } from "@/components/ui/StardustBackground";
import { PrismContainer } from "@/components/ui/PrismContainer";
import { HierarchyFlow, OrgNode } from "@/components/ui/HierarchyFlow";
import { cn } from "@/lib/utils";

type InstitutionType = "aishe" | "independent";
type EntityCategory = "Coaching Center" | "Private Academy" | "Skill Development" | "Corporate Training" | "Other";

export default function OnboardWizard() {
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Logic States
    const [isAishe, setIsAishe] = useState<boolean>(true);
    const [aisheCode, setAisheCode] = useState("");
    const [entityCategory, setEntityCategory] = useState<EntityCategory>("Coaching Center");
    const [customEntityName, setCustomEntityName] = useState("");
    const [institutionData, setInstitutionData] = useState<any>(null);

    const [adminData, setAdminData] = useState({ fullName: "", email: "", phone: "", password: "" });
    const [otp, setOtp] = useState("");
    const [preAuthToken, setPreAuthToken] = useState("");

    // Generic Organization Tree State
    const [orgNodes, setOrgNodes] = useState<OrgNode[]>([
        { id: "root", localKey: "root", parentId: null, name: "Institution", type: "Root Entity", level: 0, collapsed: false, order: 0 },
        { id: "l1-1", localKey: "l1-1", parentId: "root", name: "School of Engineering", type: "School / Faculty", level: 1, collapsed: false, order: 0 },
        { id: "l2-1", localKey: "l2-1", parentId: "l1-1", name: "Computer Science", type: "Department", level: 2, collapsed: false, order: 0 },
        { id: "l2-2", localKey: "l2-2", parentId: "l1-1", name: "Mechanical Engineering", type: "Department", level: 2, collapsed: false, order: 1 },
    ]);

    // Duration metadata for level-1 nodes (programs/schools)
    const [nodeDurations, setNodeDurations] = useState<Record<string, number>>({
        "l1-1": 4,
    });

    // Exam System Configuration State (Per Node)
    const defaultExams = [
        { id: "e1", name: "End Semester", weight: 60, color: "#1C1C1A" },
        { id: "e2", name: "Mid Semester", weight: 20, color: "#3D8528" },
        { id: "e3", name: "Assignments", weight: 10, color: "#679267" },
        { id: "e4", name: "Quiz / Tests", weight: 5, color: "#FFB3D9" },
        { id: "e5", name: "Attendance", weight: 5, color: "#FFD966" }
    ];
    const [examWeightsByNode, setExamWeightsByNode] = useState<Record<string, typeof defaultExams>>({});
    const [activeSpecNode, setActiveSpecNode] = useState<string>("");

    const [newExamName, setNewExamName] = useState("");
    const [newExamWeight, setNewExamWeight] = useState<number | "">("");

    const splitText = (text: string) => {
        return text.split(" ").map((word, i) => (
            <span key={i} className="inline-block whitespace-nowrap overflow-hidden py-1">
                {word.split("").map((char, j) => (
                    <motion.span
                        key={`${i}-${j}`}
                        initial={{ y: "110%", rotateZ: 5 }}
                        animate={{ y: 0, rotateZ: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 + (j * 0.02) }}
                        className="inline-block"
                    >
                        {char}
                    </motion.span>
                ))}
                {i < text.split(" ").length - 1 && "\u00A0"}
            </span>
        ));
    };

    const handleAisheLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const res = await fetch(`http://localhost:3001/api/v1/institutions/lookup?code=${aisheCode}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setInstitutionData(data.data);
            setStep(2);
        } catch (err: any) {
            setError(err.message || "Institution not found in national database.");
        } finally {
            setLoading(false);
        }
    };

    const handleManualInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setInstitutionData({
            institutionName: customEntityName,
            type: entityCategory,
            state: "Independent Workspace",
            district: "Global Access"
        });
        setStep(2);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const res = await fetch("http://localhost:3001/api/v1/auth/send-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: adminData.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStep(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const res = await fetch("http://localhost:3001/api/v1/auth/verify-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: adminData.email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPreAuthToken(data.preAuthToken);
            setStep(4);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSetup = async () => {
        setLoading(true); setError("");
        try {
            // Level 1 nodes = Programs/Schools, Level 2 = Departments/Branches
            const level1Nodes = orgNodes.filter(n => n.level === 1);
            const academicStructure = level1Nodes.map(prog => {
                const duration = nodeDurations[prog.id] || 4;
                const childNodes = orgNodes.filter(n => n.parentId === prog.id);
                const exams = examWeightsByNode[prog.id] || defaultExams;

                return {
                    name: prog.name,
                    durationYears: duration,
                    evaluationPolicy: exams,
                    branches: childNodes.map(b => ({
                        name: b.name,
                        semesters: Array.from({ length: duration * 2 }, (_, i) => ({
                            semesterNumber: i + 1, subjects: []
                        }))
                    }))
                };
            });

            // Also send the full org tree for backend persistence
            const organizationTree = orgNodes.map(n => ({
                id: n.id,
                parentId: n.parentId,
                name: n.name,
                type: n.type,
                level: n.level,
                order: n.order,
            }));

            const payload = {
                idempotencyKey: crypto.randomUUID(),
                preAuthToken,
                institutionDetails: {
                    aisheCode: isAishe ? institutionData.aisheCode || institutionData.aishe_code : null,
                    customName: institutionData.institutionName || institutionData.institution_name,
                    category: isAishe ? "University/College" : entityCategory
                },
                adminDetails: adminData,
                academicStructure,
                organizationTree
            };

            const res = await fetch("http://localhost:3001/api/v1/auth/onboard", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Onboarding failed.");
            setStep(6);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExamComponent = (e: React.FormEvent, nodeId: string) => {
        e.preventDefault();
        if (!newExamName.trim() || newExamWeight === "" || Number(newExamWeight) <= 0) return;

        const currentExams = examWeightsByNode[nodeId] || defaultExams;
        const colors = ["#E8604A", "#9b59b6", "#3498db", "#e67e22", "#1abc9c", "#3D8528", "#FFB3D9"];
        const randomColor = colors[currentExams.length % colors.length];

        setExamWeightsByNode({
            ...examWeightsByNode,
            [nodeId]: [...currentExams, {
                id: "e" + Date.now(),
                name: newExamName,
                weight: Number(newExamWeight),
                color: randomColor
            }]
        });
        setNewExamName("");
        setNewExamWeight("");
    };

    const removeExamComponent = (nodeId: string, examId: string) => {
        const currentExams = examWeightsByNode[nodeId] || defaultExams;
        setExamWeightsByNode({
            ...examWeightsByNode,
            [nodeId]: currentExams.filter(w => w.id !== examId)
        });
    };

    return (
        <main className="min-h-screen w-full bg-[#F4F2EB] flex flex-col items-center justify-start pt-32 pb-20 px-6 overflow-x-hidden selection:bg-[#FFB3D9]/30">
            <StardustBackground />

            {/* Header Branding */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-12 left-12 z-20"
            >
                <EvalisLogo />
            </motion.div>

            {/* Progress Indicator */}
            <div className="fixed top-12 right-12 z-20 flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-700 ${step >= i ? "w-8 bg-[#3D8528]" : "w-1 bg-[#1C1C1A]/10"}`}
                    />
                ))}
            </div>

            <div className="w-full max-w-6xl z-10 transition-all duration-500">
                <PrismContainer step={step}>
                    <AnimatePresence mode="wait">

                        {/* IDENTITY CHOICE */}
                        {step === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h1 className="text-4xl md:text-5xl font-serif text-[#1C1C1A] mb-8">
                                    {splitText("Tell us about your Hub.")}
                                </h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { setIsAishe(true); setStep(1); }}
                                        className="group p-8 bg-white/40 border border-[#1C1C1A]/5 rounded-[32px] text-left hover:bg-white hover:shadow-xl transition-all duration-500"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-[#3D8528]/10 flex items-center justify-center text-[#3D8528] mb-6 group-hover:scale-110 transition-transform">
                                            <GraduationCap size={24} />
                                        </div>
                                        <h3 className="text-xl font-serif text-[#1C1C1A] mb-2">AISHE Affiliated</h3>
                                        <p className="text-sm text-[#1C1C1A]/50 font-sans">Formal universities and colleges registered on the national database.</p>
                                    </button>
                                    <button
                                        onClick={() => { setIsAishe(false); setStep(1); }}
                                        className="group p-8 bg-white/40 border border-[#1C1C1A]/5 rounded-[32px] text-left hover:bg-white hover:shadow-xl transition-all duration-500"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-[#FFB3D9]/20 flex items-center justify-center text-[#1C1C1A] mb-6 group-hover:scale-110 transition-transform">
                                            <School size={24} />
                                        </div>
                                        <h3 className="text-xl font-serif text-[#1C1C1A] mb-2">Independent Entity</h3>
                                        <p className="text-sm text-[#1C1C1A]/50 font-sans">Coaching centers, private academies, or autonomous training hubs.</p>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* DEFINE / LOOKUP */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <button onClick={() => setStep(0)} className="mb-6 flex items-center gap-2 text-xs font-sans text-brand-green/70 hover:text-brand-green font-bold uppercase tracking-widest">
                                    <ChevronLeft size={16} /> Back to Choice
                                </button>

                                {isAishe ? (
                                    <>
                                        <h2 className="text-4xl font-serif text-[#1C1C1A] mb-4">
                                            {splitText("Find your Institution")}
                                        </h2>
                                        <p className="text-sm text-[#1C1C1A]/40 mb-10">Searching the official directory for streamlined setup.</p>
                                        <form onSubmit={handleAisheLookup} className="space-y-6">
                                            <input
                                                type="text" required placeholder="ENTER AISHE CODE (E.G. U-0001)"
                                                value={aisheCode} onChange={(e) => setAisheCode(e.target.value.toUpperCase())}
                                                className="w-full bg-white border border-[#1C1C1A]/5 rounded-2xl py-5 px-6 text-xl tracking-widest font-sans focus:outline-none focus:ring-4 focus:ring-brand-green/5 transition-all text-center"
                                            />
                                            {error && <p className="text-red-500 text-sm text-center font-sans">{error}</p>}
                                            <Button type="submit" disabled={loading} className="w-full py-5 text-lg" showArrow>
                                                {loading ? "Locating..." : "Identify Institution"}
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-serif text-[#1C1C1A] mb-4 leading-tight">
                                            {splitText("We appreciate your mission to educate.")}
                                        </h2>
                                        <p className="text-sm text-[#1C1C1A]/40 mb-10">Manual identification for independent academic hubs.</p>
                                        <form onSubmit={handleManualInfoSubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 ml-2">Entity Category</label>
                                                <Dropdown
                                                    options={["Coaching Center", "Private Academy", "Skill Development", "Corporate Training", "Other"]}
                                                    value={entityCategory}
                                                    onChange={(val) => setEntityCategory(val as EntityCategory)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 ml-2">Institution Name</label>
                                                <input
                                                    type="text" required placeholder="e.g. Nexus Learning Academy"
                                                    value={customEntityName} onChange={(e) => setCustomEntityName(e.target.value)}
                                                    className="w-full bg-white border border-[#1C1C1A]/5 rounded-2xl py-4 px-6 text-base font-sans focus:outline-none"
                                                />
                                            </div>

                                            <Button type="submit" className="w-full py-5 text-lg" showArrow>Initialize Workspace</Button>
                                        </form>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/*ADMIN SETUP */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="bg-[#3D8528]/5 p-6 rounded-3xl border border-[#3D8528]/10 mb-10 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#3D8528] shadow-sm">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-serif text-xl text-[#1C1C1A] leading-tight mb-1">
                                            {institutionData?.institutionName || institutionData?.institution_name}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <span className="text-[10px] font-sans text-[#1C1C1A]/40 tracking-wider uppercase font-bold">
                                                {institutionData?.district}, {institutionData?.state}
                                            </span>
                                            {(institutionData?.website || institutionData?.Website) && (
                                                <a
                                                    href={institutionData.website?.startsWith('http') ? institutionData.website : `http://${institutionData.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-[10px] font-sans text-brand-green font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                                                >
                                                    <Globe size={12} />
                                                    Visit Website
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-3xl font-serif text-[#1C1C1A] mb-8">Establish Authority</h2>
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <input type="text" required placeholder="Administrative Full Name" value={adminData.fullName} onChange={(e) => setAdminData({ ...adminData, fullName: e.target.value })} className="w-full bg-white/50 border border-[#1C1C1A]/5 rounded-2xl py-4 px-6 font-sans focus:bg-white transition-all" />
                                    <input type="email" required placeholder="Official Work Email" value={adminData.email} onChange={(e) => setAdminData({ ...adminData, email: e.target.value })} className="w-full bg-white/50 border border-[#1C1C1A]/5 rounded-2xl py-4 px-6 font-sans focus:bg-white transition-all" />
                                    <input type="password" required placeholder="Secure Master Password" value={adminData.password} onChange={(e) => setAdminData({ ...adminData, password: e.target.value })} className="w-full bg-white/50 border border-[#1C1C1A]/5 rounded-2xl py-4 px-6 font-sans focus:bg-white transition-all" />

                                    {error && <p className="text-red-500 text-sm font-sans">{error}</p>}
                                    <Button type="submit" disabled={loading} className="w-full py-5 mt-4" showArrow>
                                        {loading ? "Processing..." : "Secure Workspace"}
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/*OTP VERIFY */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                                <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-10">
                                    <Globe size={32} />
                                </div>
                                <h2 className="text-4xl font-serif text-[#1C1C1A] mb-4">Protocol Check</h2>
                                <p className="text-sm text-[#1C1C1A]/50 mb-12 max-w-sm mx-auto">We've dispatched a unique signature to <strong>{adminData.email}</strong>. Enter it to verify institutional presence.</p>

                                <form onSubmit={handleVerifyOtp} className="space-y-8">
                                    <input
                                        type="text" required placeholder="••••••" maxLength={6}
                                        value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-transparent text-5xl md:text-6xl text-center tracking-[0.4em] font-serif text-[#1C1C1A] focus:outline-none"
                                    />
                                    {error && <p className="text-red-500 text-sm font-sans">{error}</p>}
                                    <Button type="submit" disabled={loading} className="w-full py-5">
                                        {loading ? "Authenticating..." : "Authorize Portal"}
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 4: ORGANIZATION TREE BUILDER */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand-green text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-green/20">
                                            <LayoutGrid size={24} />
                                        </div>
                                        <div>
                                            <h2 className="font-serif text-2xl text-[#1C1C1A]">Organization Tree</h2>
                                            <p className="text-xs text-[#1C1C1A]/40 uppercase tracking-widest font-sans font-bold">Build your institutional hierarchy</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => setStep(5)} showArrow className="px-8">Finalise</Button>
                                </div>

                                <div className="rounded-[28px] border border-[#1C1C1A]/5 bg-white/20 backdrop-blur-sm">
                                    <HierarchyFlow
                                        nodes={orgNodes}
                                        onNodesChange={setOrgNodes}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: ARCHITECTURAL SPECS (Master-Detail View) */}
                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex flex-col h-full relative"
                            >
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#1C1C1A] to-[#3a3a3a] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#1C1C1A]/20">
                                        <LayoutGrid size={24} />
                                    </div>
                                    <div>
                                        <h2 className="font-serif text-4xl text-[#1C1C1A] tracking-tight">Academic Blueprint</h2>
                                        <p className="text-xs text-[#1C1C1A]/50 uppercase tracking-[0.2em] font-sans font-bold">Configure semantics & evaluation frameworks</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[60vh]">
                                    {/* Sidebar - Master List */}
                                    <div
                                        className="flex-shrink-0 w-full md:w-80 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-4 md:pb-0 pr-2 custom-scrollbar-premium overscroll-contain touch-pan-y pointer-events-auto"
                                        onWheel={(e) => e.stopPropagation()}
                                        onTouchMove={(e) => e.stopPropagation()}
                                    >
                                        <style jsx>{`
                      .custom-scrollbar-premium::-webkit-scrollbar { width: 4px; height: 4px; }
                      .custom-scrollbar-premium::-webkit-scrollbar-track { background: transparent; }
                      .custom-scrollbar-premium::-webkit-scrollbar-thumb { background: rgba(28, 28, 26, 0.1); border-radius: 10px; }
                    `}</style>
                                        {orgNodes.filter(n => n.level === 1).map((node, i) => {
                                            const isActive = activeSpecNode === node.id || (!activeSpecNode && i === 0);
                                            if (isActive && !activeSpecNode) setActiveSpecNode(node.id);
                                            return (
                                                <button
                                                    key={node.id}
                                                    onClick={() => setActiveSpecNode(node.id)}
                                                    className={`flex-shrink-0 md:flex-shrink w-64 md:w-full text-left p-5 rounded-[24px] border transition-all duration-300 ${isActive ? "bg-white border-brand-green/30 shadow-lg shadow-brand-green/5 ring-1 ring-brand-green/10" : "bg-white/40 border-[#1C1C1A]/5 hover:bg-white/80"}`}
                                                >
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mb-1 block">
                                                        Level 1 • {orgNodes.filter(n => n.parentId === node.id).length} Branches
                                                    </span>
                                                    <h3 className={`font-serif text-xl ${isActive ? "text-brand-green" : "text-[#1C1C1A]"}`}>{node.name}</h3>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Main Detail View */}
                                    <div
                                        className="flex-1 bg-white border border-[#1C1C1A]/5 rounded-[32px] p-6 md:p-8 shadow-sm overflow-y-auto relative custom-scrollbar-premium overscroll-contain touch-pan-y pointer-events-auto"
                                        onWheel={(e) => e.stopPropagation()}
                                        onTouchMove={(e) => e.stopPropagation()}
                                    >
                                        {(() => {
                                            const activeNode = orgNodes.find(n => n.id === activeSpecNode) || orgNodes.find(n => n.level === 1);
                                            if (!activeNode) return null;

                                            const currentExams = examWeightsByNode[activeNode.id] || defaultExams;
                                            const totalExamWeight = currentExams.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
                                            const currentDuration = nodeDurations[activeNode.id] || 4;

                                            return (
                                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4 mb-8 pb-6 border-b border-[#1C1C1A]/5">
                                                        <div>
                                                            <h3 className="font-serif text-3xl text-[#1C1C1A] mb-2">{activeNode.name} Policy</h3>
                                                            <p className="text-xs text-[#1C1C1A]/40 uppercase tracking-widest font-bold">Duration & Examination</p>
                                                        </div>

                                                        <div className="flex items-center gap-4 bg-[#F4F2EB] p-2 rounded-2xl w-fit">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 px-3">Course Duration</label>
                                                            <select
                                                                value={currentDuration.toString()}
                                                                onChange={(e) => setNodeDurations(prev => ({ ...prev, [activeNode.id]: parseInt(e.target.value) }))}
                                                                className="bg-white border border-[#1C1C1A]/10 text-brand-green font-bold rounded-xl px-4 py-2 focus:outline-none"
                                                            >
                                                                {[1, 2, 3, 4, 5, 6].map(yr => <option key={yr} value={yr}>{yr} {yr === 1 ? 'Year' : 'Years'}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
                                                        {/* Academic Timeline */}
                                                        <div className="bg-[#1C1C1A]/[0.02] border border-[#1C1C1A]/5 rounded-3xl p-6 relative overflow-hidden">
                                                            <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1C1C1A]/40 mb-6">Academic Timeline</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Array.from({ length: currentDuration * 2 }).map((_, idx) => (
                                                                    <div key={idx} className="flex-1 min-w-[40px] h-12 bg-white rounded-xl border border-[#1C1C1A]/10 flex items-center justify-center shadow-sm relative group/sem">
                                                                        <span className="font-bold text-[#1C1C1A] text-sm">S{idx + 1}</span>
                                                                        <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover/sem:opacity-100 transition-opacity rounded-xl" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Total Marks Widget */}
                                                        <div className="bg-[#1C1C1A]/[0.02] border border-[#1C1C1A]/5 rounded-3xl p-6 flex flex-col justify-between">
                                                            <div>
                                                                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1C1C1A]/40 mb-1">Total Matrix Weight</h4>
                                                                <div className="flex justify-between items-start">
                                                                    <h3 className="font-serif text-5xl flex items-baseline gap-2">
                                                                        <span className={totalExamWeight === 100 ? "text-brand-green" : "text-red-500"}>{totalExamWeight}</span>
                                                                        <span className="text-lg text-[#1C1C1A]/20 font-sans">%</span>
                                                                    </h3>
                                                                    {totalExamWeight !== 100 && (
                                                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase tracking-widest text-center max-w-[120px]">
                                                                            Distribution Must Equal 100
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="w-full h-3 bg-[#1C1C1A]/10 rounded-full overflow-hidden flex shadow-inner mt-6">
                                                                {currentExams.map((ew) => (
                                                                    <div key={ew.id} className="h-full transition-all duration-500" style={{ backgroundColor: ew.color, width: `${(ew.weight / Math.max(100, totalExamWeight)) * 100}%` }} title={ew.name} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Exam Details Section */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1C1C1A]/40 mb-4">Evaluation Matrix Components</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {currentExams.map(ew => (
                                                                <div key={ew.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#1C1C1A]/10 shadow-[0_2px_10px_rgba(28,28,26,0.02)] group/item">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: ew.color }} />
                                                                        <span className="font-semibold text-sm text-[#1C1C1A]">{ew.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs font-bold bg-[#F4F2EB] px-2 py-1 rounded text-[#1C1C1A]/60">{ew.weight} Marks</span>
                                                                        <button onClick={() => removeExamComponent(activeNode.id, ew.id)} className="text-red-500/50 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 p-1">
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <form onSubmit={(e) => handleAddExamComponent(e, activeNode.id)} className="flex flex-col sm:flex-row items-center gap-3 mt-4 pt-4 border-t border-[#1C1C1A]/5">
                                                            <input type="text" placeholder="Component Name (e.g. Viva)" value={newExamName} onChange={e => setNewExamName(e.target.value)} className="w-full sm:flex-[2] bg-[#F4F2EB] text-sm text-[#1C1C1A] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-green/20 outline-none" required />
                                                            <input type="number" placeholder="Weight" min="1" value={newExamWeight} onChange={e => setNewExamWeight(e.target.value ? Number(e.target.value) : "")} className="w-full sm:flex-1 bg-[#F4F2EB] text-sm text-[#1C1C1A] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-green/20 outline-none" required />
                                                            <Button type="submit" variant="outline" className="w-full sm:w-auto px-5 py-3 border-[#1C1C1A]/10 bg-white">Add</Button>
                                                        </form>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-500 text-xs mt-4 text-center font-bold bg-red-50 py-3 rounded-2xl border border-red-100">
                                        {error}
                                    </p>
                                )}

                                <div className="flex gap-4 mt-8 pt-6 border-t border-[#1C1C1A]/5 relative z-20">
                                    <Button onClick={() => setStep(4)} variant="outline" className="flex-1 py-5 border-[#1C1C1A]/10 text-[#1C1C1A] hover:bg-white transition-all">
                                        Back to Hierarchy
                                    </Button>
                                    <Button
                                        onClick={handleCompleteSetup}
                                        disabled={
                                            loading ||
                                            orgNodes.filter(n => n.level === 1).some(n => {
                                                const exams = examWeightsByNode[n.id] || defaultExams;
                                                const w = exams.reduce((a, c) => a + (Number(c.weight) || 0), 0);
                                                return w !== 100;
                                            })
                                        }
                                        className="flex-[2] py-5 shadow-2xl shadow-brand-green/20 bg-[#1C1C1A] hover:bg-brand-green text-white font-bold tracking-widest uppercase transition-all"
                                        showArrow
                                    >
                                        {loading ? "Initializing..." : "Finalize Blueprint"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/*SUCCESS */}
                        {step === 6 && (
                            <motion.div key="step6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                                <div className="w-24 h-24 bg-brand-green text-white rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(61,133,40,0.3)]">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1A] mb-6">Ascended.</h2>
                                <p className="text-[#1C1C1A]/50 font-sans mb-12 max-w-sm mx-auto leading-relaxed">
                                    Your institutional blueprint is now crystallized on the Evalis Intelligence Grid.
                                </p>
                                <div className="flex flex-col gap-4">
                                    <Button onClick={() => router.push('/login')} className="w-full py-6 text-xl shadow-xl shadow-brand-green/10 bg-brand-green hover:bg-brand-green/90 text-white border-0">Enter Portal</Button>
                                    <p className="text-[10px] text-[#1C1C1A]/20 uppercase tracking-[0.3em] font-sans font-black mt-4">EVALIS INTELLIGENCE CORE v1.4</p>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </PrismContainer>
            </div>
        </main>
    );
}
