"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PenLine, Layers, Check, Loader2, X, FileText, Download, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { downloadInternalTemplate, downloadExternalTemplate } from "@/utils/excelGenerator";

interface MarksEntryPanelProps {
    preselectedBatchId?: string;
    preselectedSubjectId?: string;
}

const normalizeSchoolName = (name: string) =>
    name.trim().toLowerCase().replace(/\bschool\b/g, '').replace(/\bof\b/g, '').replace(/sciences?$/, 'science').replace(/[^a-z0-9]/g, '');

export function MarksEntryPanel({ preselectedBatchId, preselectedSubjectId }: MarksEntryPanelProps) {
    const [batches, setBatches] = useState<any[]>([]);
    const [instances, setInstances] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [allBranches, setAllBranches] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [schemas, setSchemas] = useState<any[]>([]);

    const [marksBatchId, setMarksBatchId] = useState(preselectedBatchId || "");
    const [marksSemester, setMarksSemester] = useState<number | "">("");
    const [marksInstanceId, setMarksInstanceId] = useState("");
    const [marksSchoolId, setMarksSchoolId] = useState("");
    const [marksBranchId, setMarksBranchId] = useState("");
    const [marksSubjectId, setMarksSubjectId] = useState(preselectedSubjectId || "");
    const [marksComponentId, setMarksComponentId] = useState("");
    const [marksInput, setMarksInput] = useState<Record<string, number>>({});
    const [isSavingMarks, setIsSavingMarks] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importType, setImportType] = useState("INTERNAL_GROUP");
    const [isImporting, setIsImporting] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            const [batchData, instData, schemaData, structData] = await Promise.all([
                api.get("/api/v1/batch"),
                api.get("/api/v1/exam/instances"),
                api.get("/api/v1/exam/schemas"),
                api.get("/api/v1/academic/structure?versionId=current"),
            ]);
            setBatches(batchData.batches || []);
            setInstances(instData.instances || []);
            setSchemas(schemaData.schemas || []);

            if (structData?.programs) {
                const schoolMap: Record<string, any> = {};
                const branchMap = new Map<string, any>();
                const subjs: any[] = [];
                structData.programs.forEach((p: any) => {
                    p.schools?.forEach((sch: any) => {
                        const key = normalizeSchoolName(sch.name);
                        if (!schoolMap[key]) schoolMap[key] = { id: sch.id, name: sch.name, originalIds: [sch.id] };
                        else schoolMap[key].originalIds.push(sch.id);
                        sch.branches?.forEach((br: any) => {
                            if (!branchMap.has(br.id)) branchMap.set(br.id, { ...br, schoolId: sch.id, schoolName: key, programName: p.name });
                            br.semesters?.forEach((sem: any) => sem.subjects?.forEach((s: any) => subjs.push({ ...s, branchId: br.id, semesterNumber: sem.semesterNumber })));
                        });
                    });
                });
                setSchools(Object.values(schoolMap));
                setAllBranches(Array.from(branchMap.values()));
                setSubjects(subjs);
            }
        } catch { toast.error("Failed to load data"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (marksBatchId && batches.length > 0) {
            const b = batches.find(b => b.id === marksBatchId);
            if (b) {
                setMarksSemester(b.currentSemester);
                const brId = b.branchId || b.branch?.id || "";
                setMarksBranchId(brId);
                const sId = b.branch?.schoolId || b.branch?.school?.id || "";
                if (sId) {
                    const s = schools.find(s => s.originalIds?.includes(sId));
                    setMarksSchoolId(s ? s.id : sId);
                }
            }
        }
    }, [marksBatchId, batches, schools]);

    const filteredBranchOptions = useMemo(() => {
        if (!marksSchoolId) return [];
        const selectedSchool = schools.find(s => s.id === marksSchoolId || s.originalIds?.includes(marksSchoolId));
        if (!selectedSchool) return [];
        const currentBatch = batches.find(b => b.id === marksBatchId);
        const batchProgramName = currentBatch?.branch?.school?.program?.name?.trim().toLowerCase();
        let branches = allBranches.filter(br => br.schoolName === normalizeSchoolName(selectedSchool.name));
        if (batchProgramName) branches = branches.filter(br => br.programName?.trim().toLowerCase() === batchProgramName);
        const map = new Map();
        branches.forEach(br => { const k = br.name.toLowerCase().replace(/[^a-z0-9]/g, ''); if (!map.has(k)) map.set(k, { id: br.id, name: br.name }); });
        return Array.from(map.values());
    }, [marksSchoolId, marksBatchId, schools, batches, allBranches]);

    const fetchStudentsForMarks = useCallback(async (batchId: string) => {
        if (!batchId) return;
        setIsLoadingStudents(true);
        try {
            const data = await api.get(`/api/v1/user?batchId=${batchId}&role=STUDENT&limit=200`);
            setStudents(data.users || []);
            if (marksInstanceId && marksSubjectId && marksComponentId) {
                const md = await api.get(`/api/v1/exam/marks/${marksSubjectId}?examInstanceId=${marksInstanceId}`);
                const em: Record<string, number> = {};
                (md.marks || []).filter((m: any) => m.componentId === marksComponentId).forEach((m: any) => { em[m.studentId] = m.marksObtained; });
                setMarksInput(em);
            } else setMarksInput({});
        } catch { toast.error("Failed to load students"); }
        finally { setIsLoadingStudents(false); }
    }, [marksInstanceId, marksSubjectId, marksComponentId]);

    useEffect(() => { if (marksBatchId) fetchStudentsForMarks(marksBatchId); }, [marksBatchId, marksInstanceId, marksSubjectId, marksComponentId]);

    const handleSaveMarks = async () => {
        if (!marksInstanceId || !marksSubjectId || !marksComponentId) { toast.error("Select all filters"); return; }
        setIsSavingMarks(true);
        try {
            const marksArray = Object.entries(marksInput).map(([studentId, marksObtained]) => ({ studentId, componentId: marksComponentId, marksObtained }));
            await api.post("/api/v1/exam/marks", { examInstanceId: marksInstanceId, subjectId: marksSubjectId, marks: marksArray });
            toast.success("Marks saved!");
        } catch (err: any) { toast.error(err.message || "Failed to save marks"); }
        finally { setIsSavingMarks(false); }
    };

    const handleBulkImport = async () => {
        if (!marksInstanceId || !marksSubjectId || !importFile) { toast.error("Select Exam, Subject and File"); return; }
        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('examInstanceId', marksInstanceId);
            formData.append('subjectId', marksSubjectId);
            formData.append('componentId', marksComponentId);
            formData.append('type', importType);
            const data = await api.post("/api/v1/exam/marks/upload", formData);
            toast.success(data.message || "Import successful!");
            setShowBulkImport(false);
            setImportFile(null);
            if (marksBatchId) fetchStudentsForMarks(marksBatchId);
        } catch (err: any) { toast.error(err.message || "Failed to import"); }
        finally { setIsImporting(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    const activeInstance = instances.find(i => i.id === marksInstanceId);

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white/70 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Batch", value: marksBatchId, onChange: (v: string) => { setMarksBatchId(v); setMarksSubjectId(""); setMarksComponentId(""); }, options: batches.map(b => ({ value: b.id, label: b.name })) },
                        { label: "Semester", value: String(marksSemester), onChange: (v: string) => { setMarksSemester(parseInt(v) || ""); setMarksSubjectId(""); setMarksComponentId(""); }, options: [1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Sem ${s}` })) },
                        { label: "Exam", value: marksInstanceId, onChange: (v: string) => { setMarksInstanceId(v); setMarksSubjectId(""); setMarksComponentId(""); }, options: instances.filter(i => i.batch?.id === marksBatchId && i.semester === marksSemester).map(i => ({ value: i.id, label: `${i.name} (${i.status}${i.marksEntryClosed ? ' - CLOSED' : ''})` })) },
                    ].map(sel => (
                        <div key={sel.label} className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">{sel.label}</label>
                            <select value={sel.value} onChange={e => sel.onChange(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green">
                                <option value="">Select {sel.label}</option>
                                {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">School</label>
                        <select value={marksSchoolId} onChange={e => { setMarksSchoolId(e.target.value); setMarksBranchId(""); setMarksSubjectId(""); }} className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green">
                            <option value="">Select School</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Branch</label>
                        <select value={marksBranchId} onChange={e => { setMarksBranchId(e.target.value); setMarksSubjectId(""); }} className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green">
                            <option value="">Select Branch</option>
                            {filteredBranchOptions.map(br => <option key={br.id} value={br.id}>{br.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Subject</label>
                        <select value={marksSubjectId} onChange={e => { setMarksSubjectId(e.target.value); setMarksComponentId(""); }} className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green">
                            <option value="">Select Subject</option>
                            {subjects.filter(s => String(s.branchId) === String(marksBranchId) && Number(s.semesterNumber) === Number(marksSemester)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Evaluation Part</label>
                        <select value={marksComponentId} onChange={e => setMarksComponentId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green">
                            <option value="">Select Part</option>
                            <option value="INTERNAL_GROUP">Internal (Midsem, Quiz, Assign, Attd)</option>
                            <option value="EXTERNAL_GROUP">External (End Semester)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Marks Table / Empty State */}
            {!marksInstanceId || !marksSubjectId || !marksComponentId ? (
                <div className="bg-white/40 border border-dashed border-[#1C1C1A]/10 rounded-3xl p-20 text-center">
                    <PenLine size={48} className="mx-auto mb-4 text-[#1C1C1A]/10" />
                    <h3 className="text-lg font-bold text-[#1C1C1A]/40 italic font-serif">Awaiting Configuration</h3>
                    <p className="text-xs text-[#1C1C1A]/30 mt-1 uppercase tracking-widest font-black">Select Exam, Subject, and Component to start entering marks.</p>
                </div>
            ) : isLoadingStudents ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-brand-green" size={32} /></div>
            ) : (marksComponentId === 'INTERNAL_GROUP' || marksComponentId === 'EXTERNAL_GROUP') ? (
                <div className="bg-brand-green/5 border border-brand-green/20 rounded-3xl p-12 text-center">
                    <Layers size={48} className="mx-auto mb-4 text-brand-green/50" />
                    <h3 className="text-xl font-bold text-[#1C1C1A] font-serif">Outcome-Based Evaluation</h3>
                    <p className="text-sm text-[#1C1C1A]/60 mt-2 max-w-md mx-auto">Download the OBE template, fill it offline, then upload it here.</p>
                    <button onClick={() => { setImportType(marksComponentId); setShowBulkImport(true); }} className="mt-6 px-8 py-3 bg-brand-green text-white rounded-2xl text-sm font-bold flex items-center gap-2 mx-auto">
                        <FileText size={16} /> Open Upload & Download Panel
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-[#1C1C1A]/5 rounded-3xl overflow-hidden shadow-xl">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#F4F2EB] border-b border-[#1C1C1A]/5">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Roll Number</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Student Name</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Marks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C1A]/5">
                            {students.map(student => (
                                <tr key={student.id} className="hover:bg-[#F4F2EB]/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-black text-[#1C1C1A]/40 font-mono uppercase">{student.rollNumber || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#1C1C1A]">{student.fullName}</td>
                                    <td className="px-6 py-4 text-right">
                                        <input type="number" value={marksInput[student.id] ?? ""} onChange={e => { const val = parseFloat(e.target.value); setMarksInput({ ...marksInput, [student.id]: val }); }} className="w-20 px-3 py-2 bg-[#F4F2EB] border border-[#1C1C1A]/5 rounded-xl text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-brand-green/20" placeholder="0.0" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-6 bg-[#F4F2EB] flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">{students.length} Students</span>
                        <div className="flex gap-3">
                            <button onClick={() => setShowBulkImport(true)} className="px-5 py-2.5 bg-white border border-[#1C1C1A]/10 text-[#1C1C1A] rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-[#F4F2EB]">
                                <Layers size={16} /> Bulk Import
                            </button>
                            <button onClick={handleSaveMarks} disabled={isSavingMarks || activeInstance?.status !== 'ACTIVE' || activeInstance?.marksEntryClosed} className="px-8 py-2.5 bg-brand-green text-white rounded-2xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                                {isSavingMarks ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Marks
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkImport && (
                <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif font-bold text-[#1C1C1A]">Bulk Import Marks</h2>
                            <button onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-[#F4F2EB] rounded-full"><X size={20} className="text-[#1C1C1A]/40" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block mb-2">Import Type</label>
                                <select value={importType} onChange={e => setImportType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm font-bold focus:outline-none">
                                    <option value="INTERNAL_GROUP">Internal Group (All 4 parts)</option>
                                    <option value="EXTERNAL_GROUP">End Semester (External)</option>
                                </select>
                            </div>
                            <div className="relative group">
                                <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setImportFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                <div className={`w-full px-4 py-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 transition-all ${importFile ? 'border-brand-green bg-brand-green/5' : 'border-[#1C1C1A]/10 bg-[#F4F2EB]/50'}`}>
                                    <Layers className={importFile ? 'text-brand-green' : 'text-[#1C1C1A]/20'} size={32} />
                                    <span className="text-sm font-bold text-[#1C1C1A]">{importFile ? importFile.name : 'Click to select Excel file'}</span>
                                </div>
                            </div>
                            {(importType === 'INTERNAL_GROUP' || importType === 'EXTERNAL_GROUP') && (
                                <button onClick={() => { const batch = batches.find(b => b.id === marksBatchId); const sub = subjects.find(s => s.id === marksSubjectId); if (importType === 'INTERNAL_GROUP') downloadInternalTemplate(batch?.name || 'Batch', 'School', sub?.name || 'Subject', String(marksSemester), students); else downloadExternalTemplate(batch?.name || 'Batch', 'School', sub?.name || 'Subject', String(marksSemester), students); }} className="w-full py-3 bg-[#F4F2EB] rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#EAE8E0]">
                                    <Download size={16} /> Download {importType === 'INTERNAL_GROUP' ? 'Internal' : 'External'} Template
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowBulkImport(false)} className="flex-1 py-4 bg-[#F4F2EB] rounded-2xl text-sm font-bold">Cancel</button>
                            <button onClick={handleBulkImport} disabled={isImporting || !importFile} className="flex-[2] py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                {isImporting ? "Processing..." : "Start Import"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
