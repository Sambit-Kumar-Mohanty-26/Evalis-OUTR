"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList, Plus, Layers, FileText, PenLine, BarChart3,
    Loader2, Check, X, Lock, Unlock, AlertTriangle,
    GripVertical, Trash2, ChevronDown, BookOpen, Play, Download
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { downloadInternalTemplate, downloadExternalTemplate } from "../../../utils/excelGenerator";

type Tab = 'schemas' | 'instances' | 'marks' | 'results';

interface ExamQuestion {
    id?: string;
    label: string;
    maxMarks: number;
    order: number;
}

interface ExamComponent {
    id?: string;
    name: string;
    maxMarks: number;
    category: string;
    order: number;
    questions?: ExamQuestion[];
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
    marksDeadline: string | null;
    marksEntryClosed: boolean;
    batch: { id: string; name: string; currentSemester: number };
    _count: { marks: number; results: number };
}

const normalizeSchoolName = (name: string) => {
    return name.trim().toLowerCase()
        .replace(/\bschool\b/g, '')
        .replace(/\bof\b/g, '')
        .replace(/sciences?$/, 'science')
        .replace(/[^a-z0-9]/g, '');
};

export default function ExamsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('schemas');
    const [schemas, setSchemas] = useState<ExamSchema[]>([]);
    const [instances, setInstances] = useState<ExamInstance[]>([]);
    const [loading, setLoading] = useState(true);

    // Schema Builder
    const [showSchemaBuilder, setShowSchemaBuilder] = useState(false);
    const [editingSchemaId, setEditingSchemaId] = useState<string | null>(null);
    const [schemaName, setSchemaName] = useState("");
    const [schemaType, setSchemaType] = useState("THEORY");
    const [schemaTotalMarks, setSchemaTotalMarks] = useState(100);
    const [schemaComponents, setSchemaComponents] = useState<ExamComponent[]>([
        { name: "Attendance", maxMarks: 5, category: "INTERNAL", order: 0, questions: [] },
        { name: "Assignment", maxMarks: 10, category: "INTERNAL", order: 1, questions: [] },
        { name: "Mid Semester", maxMarks: 25, category: "INTERNAL", order: 2, questions: [] },
        { name: "End Semester", maxMarks: 60, category: "EXTERNAL", order: 3, questions: [] },
    ]);

    // Instance Creator
    const [showInstanceCreator, setShowInstanceCreator] = useState(false);
    const [instanceName, setInstanceName] = useState("");
    const [instanceBatchId, setInstanceBatchId] = useState("");
    const [instanceSemester, setInstanceSemester] = useState<number>(1);
    const [instanceDeadline, setInstanceDeadline] = useState("");
    const [batches, setBatches] = useState<any[]>([]);

    // Subject Mapping
    const [showSubjectMapper, setShowSubjectMapper] = useState(false);
    const [mappingSchemaId, setMappingSchemaId] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    // Marks Entry
    const [marksBatchId, setMarksBatchId] = useState("");
    const [marksSemester, setMarksSemester] = useState<number | "">("");
    const [marksInstanceId, setMarksInstanceId] = useState("");
    const [marksSubjectId, setMarksSubjectId] = useState("");
    const [marksComponentId, setMarksComponentId] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [marksInput, setMarksInput] = useState<Record<string, number>>({});
    const [isSavingMarks, setIsSavingMarks] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [schools, setSchools] = useState<any[]>([]);
    const [allBranches, setAllBranches] = useState<any[]>([]);
    const [marksSchoolId, setMarksSchoolId] = useState("");
    const [marksBranchId, setMarksBranchId] = useState("");

    // Results Tab
    // Results Tab
    const [resultsData, setResultsData] = useState<any[]>([]);
    const [selectedResultInstanceId, setSelectedResultInstanceId] = useState("");
    const [isLoadingResults, setIsLoadingResults] = useState(false);

    const filteredBranchOptions = useMemo(() => {
        if (!marksBatchId || !marksSchoolId) return [];
        
        const selectedSchool = schools.find(s => s.id === marksSchoolId || s.originalIds?.includes(marksSchoolId));
        if (!selectedSchool) return [];
        
        const currentBatch = batches.find(b => b.id === marksBatchId);
        if (!currentBatch) return [];
        
        const targetSchoolKey = normalizeSchoolName(selectedSchool.name);
        
        // Find the program name of the currently selected batch (e.g., "B.Tech" or "M.Tech")
        const batchProgramName = currentBatch.branch?.school?.program?.name?.trim().toLowerCase();

        // 1. Get all branches belonging to this school from blueprint
        let blueprintBranches = allBranches.filter(br => br.schoolName === targetSchoolKey);

        // 2. Filter by program name to ensure we don't mix B.Tech and M.Tech branches
        if (batchProgramName) {
            blueprintBranches = blueprintBranches.filter(br => {
                const brProgramName = br.programName?.trim().toLowerCase();
                return brProgramName === batchProgramName;
            });
        }

        const normalizeBranchName = (name: string) => {
            return name.toLowerCase()
                .replace(/\bengineering\b/g, '')
                .replace(/\bb\.tech\b/g, '')
                .replace(/\bm\.tech\b/g, '')
                .replace(/[^a-z0-9]/g, '')
                .trim();
        };

        // 3. Deduplicate by normalized name
        const branchMap = new Map();
        blueprintBranches.forEach(br => {
            const nameKey = normalizeBranchName(br.name);
            if (!branchMap.has(nameKey)) {
                branchMap.set(nameKey, {
                    id: br.id,
                    name: br.name
                });
            }
        });

        return Array.from(branchMap.values());
    }, [marksBatchId, marksSchoolId, schools, batches, allBranches]);


    const [isCreatingSchema, setIsCreatingSchema] = useState(false);
    const [isCreatingInstance, setIsCreatingInstance] = useState(false);
    const [isMappingSchema, setIsMappingSchema] = useState(false);
    const [isPublishing, setIsPublishing] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<string>("INTERNAL_GROUP");
    const [isImporting, setIsImporting] = useState(false);

    const fetchSchemas = useCallback(async () => {
        try {
            const data = await api.get("/api/v1/exam/schemas");
            setSchemas(data.schemas || []);
        } catch { toast.error("Failed to load schemas"); }
    }, []);

    const fetchInstances = useCallback(async () => {
        try {
            const data = await api.get("/api/v1/exam/instances");
            setInstances(data.instances || []);
        } catch { toast.error("Failed to load exam instances"); }
    }, []);

    const fetchBatches = useCallback(async () => {
        try {
            const data = await api.get("/api/v1/batch");
            setBatches(data.batches || []);
        } catch {}
    }, []);



    const fetchStructure = useCallback(async () => {
        try {
            const data = await api.get("/api/v1/academic/structure?versionId=current");
            if (data && data.programs) {
                const schoolMap: Record<string, any> = {};
                const branchMap = new Map<string, any>();
                const subjs: any[] = [];
                
                data.programs.forEach((p: any) => {
                    p.schools?.forEach((sch: any) => {
                        const originalName = sch.name.trim();
                        const normalizedKey = normalizeSchoolName(originalName);

                        if (!schoolMap[normalizedKey]) {
                            schoolMap[normalizedKey] = { 
                                id: sch.id, 
                                name: originalName, 
                                key: normalizedKey,
                                originalIds: [sch.id] 
                            };
                        } else {
                            schoolMap[normalizedKey].originalIds.push(sch.id);
                        }

                        sch.branches?.forEach((br: any) => {
                            if (!branchMap.has(br.id)) {
                                branchMap.set(br.id, { 
                                    ...br, 
                                    schoolId: sch.id, 
                                    schoolName: normalizedKey,
                                    programId: p.id,
                                    programName: p.name
                                });
                            }

                            // Collect subjects from semesters
                            br.semesters?.forEach((sem: any) => {
                                sem.subjects?.forEach((s: any) => {
                                    subjs.push({
                                        ...s,
                                        branchId: br.id,
                                        semesterNumber: sem.semesterNumber
                                    });
                                });
                            });
                        });
                    });
                });
                
                setSchools(Object.values(schoolMap));
                setAllBranches(Array.from(branchMap.values()));
                setSubjects(subjs);
            }
        } catch {}
    }, []);

    useEffect(() => {
        Promise.all([
            fetchSchemas(), 
            fetchInstances(), 
            fetchBatches(), 
            fetchStructure()
        ]).finally(() => setLoading(false));
    }, [fetchSchemas, fetchInstances, fetchBatches, fetchStructure]);

    // Sync School and Branch when Batch is selected or data loads
    useEffect(() => {
        if (marksBatchId && batches.length > 0) {
            const b = batches.find(b => b.id === marksBatchId);
            if (b) {
                const brId = b.branchId || b.branch?.id || "";
                setMarksBranchId(brId);
                
                const sId = b.branch?.schoolId || b.branch?.school?.id || "";
                if (sId) {
                    // Find the canonical ID for this school name in our deduplicated list
                    const originalSchool = schools.find(s => s.originalIds?.includes(sId));
                    if (originalSchool) {
                        setMarksSchoolId(originalSchool.id);
                    } else {
                        setMarksSchoolId(sId);
                    }
                } else if (brId && allBranches.length > 0) {
                    const foundBr = allBranches.find(br => br.id === brId);
                    if (foundBr?.schoolName) {
                        const canonicalSchool = schools.find(s => s.name.toLowerCase() === foundBr.schoolName);
                        if (canonicalSchool) setMarksSchoolId(canonicalSchool.id);
                    }
                }
            }
        }
    }, [marksBatchId, batches, allBranches]);

    const componentTotal = schemaComponents.reduce((sum, c) => sum + c.maxMarks, 0);
    const isValidTotal = componentTotal === schemaTotalMarks;

    const handleCreateSchema = async () => {
        if (!schemaName.trim()) { toast.error("Schema name is required"); return; }
        if (!isValidTotal) { toast.error(`Component total (${componentTotal}) must equal ${schemaTotalMarks}`); return; }
        setIsCreatingSchema(true);
        try {
            const payload = {
                name: schemaName,
                type: schemaType,
                totalMarks: schemaTotalMarks,
                components: schemaComponents,
            };

            if (editingSchemaId) {
                await api.put(`/api/v1/exam/schemas/${editingSchemaId}`, payload);
                toast.success("Exam schema updated!");
            } else {
                await api.post("/api/v1/exam/schemas", payload);
                toast.success("Exam schema created!");
            }

            closeSchemaBuilder();
            fetchSchemas();
        } catch (err: any) {
            toast.error(err.message || "Failed to save schema");
        } finally {
            setIsCreatingSchema(false);
        }
    };

    const closeSchemaBuilder = () => {
        setShowSchemaBuilder(false);
        setEditingSchemaId(null);
        setSchemaName("");
        setSchemaType("THEORY");
        setSchemaTotalMarks(100);
        setSchemaComponents([
            { name: "Attendance", maxMarks: 5, category: "INTERNAL", order: 0, questions: [] },
            { name: "Assignment", maxMarks: 10, category: "INTERNAL", order: 1, questions: [] },
            { name: "Mid Semester", maxMarks: 25, category: "INTERNAL", order: 2, questions: [] },
            { name: "End Semester", maxMarks: 60, category: "EXTERNAL", order: 3, questions: [] },
        ]);
    };

    const openNewSchema = () => {
        closeSchemaBuilder();
        setShowSchemaBuilder(true);
    };

    const openEditSchema = (schema: ExamSchema) => {
        setEditingSchemaId(schema.id);
        setSchemaName(schema.name);
        setSchemaType(schema.type);
        setSchemaTotalMarks(schema.totalMarks);
        setSchemaComponents(schema.components.map(c => ({
            name: c.name,
            maxMarks: c.maxMarks,
            category: c.category,
            order: c.order,
            questions: []
        })));
        setShowSchemaBuilder(true);
    };

    const handleCreateInstance = async () => {
        if (!instanceName.trim() || !instanceBatchId) { toast.error("Fill all fields"); return; }
        setIsCreatingInstance(true);
        try {
            await api.post("/api/v1/exam/instances", {
                name: instanceName,
                batchId: instanceBatchId,
                semester: instanceSemester,
                marksDeadline: instanceDeadline || null,
            });
            toast.success("Exam instance created!");
            setShowInstanceCreator(false);
            setInstanceName("");
            fetchInstances();
        } catch (err: any) {
            toast.error(err.message || "Failed to create instance");
        } finally {
            setIsCreatingInstance(false);
        }
    };

    const handleMapSchemaToSubjects = async () => {
        if (!mappingSchemaId || selectedSubjects.length === 0) { toast.error("Select subjects to map"); return; }
        setIsMappingSchema(true);
        try {
            await api.put(`/api/v1/exam/schemas/${mappingSchemaId}/map`, { subjectIds: selectedSubjects });
            toast.success("Subjects mapped successfully!");
            setShowSubjectMapper(false);
            fetchSchemas();
            fetchStructure();
        } catch (err: any) {
            toast.error(err.message || "Failed to map subjects");
        } finally {
            setIsMappingSchema(false);
        }
    };

    const handleStatusTransition = async (id: string, status?: string, marksEntryClosed?: boolean) => {
        setIsUpdatingStatus(id);
        try {
            await api.put(`/api/v1/exam/instances/${id}/status`, { status, marksEntryClosed });
            toast.success("Exam status updated!");
            fetchInstances();
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handlePublishResults = async (instanceId: string) => {
        if (!confirm("Publish all results for this exam? This will make them visible to students.")) return;
        setIsPublishing(instanceId);
        try {
            const data = await api.post(`/api/v1/exam/instances/${instanceId}/publish`);
            toast.success(data.message || "Results published!");
            fetchInstances();
        } catch {
            toast.error("Failed to publish results");
        } finally {
            setIsPublishing(null);
        }
    };

    const handleCalculateResults = async (instanceId: string) => {
        setIsCalculating(instanceId);
        try {
            const data = await api.post("/api/v1/exam/results/calculate", { examInstanceId: instanceId });
            toast.success(`${data.message} (${data.studentsProcessed} students processed)`);
            fetchInstances();
        } catch (err: any) {
            toast.error(err.message || "Failed to calculate results");
        } finally {
            setIsCalculating(null);
        }
    };

    const fetchStudentsForMarks = async (batchId: string) => {
        if (!batchId) return;
        setIsLoadingStudents(true);
        try {
            const data = await api.get(`/api/v1/user?batchId=${batchId}&role=STUDENT&limit=200`);
            setStudents(data.users || []);
            
            // Initialize marksInput if we have marks for this instance/subject/component
            if (marksInstanceId && marksSubjectId && marksComponentId) {
                const marksData = await api.get(`/api/v1/exam/marks/${marksSubjectId}?examInstanceId=${marksInstanceId}`);
                const existingMarks: Record<string, number> = {};
                (marksData.marks || []).filter((m: any) => m.componentId === marksComponentId).forEach((m: any) => {
                    existingMarks[m.studentId] = m.marksObtained;
                });
                setMarksInput(existingMarks);
            } else {
                setMarksInput({});
            }
        } catch {
            toast.error("Failed to load students");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const handleSaveMarks = async () => {
        if (!marksInstanceId || !marksSubjectId || !marksComponentId) { toast.error("Select all filters"); return; }
        setIsSavingMarks(true);
        try {
            const marksArray = Object.entries(marksInput).map(([studentId, marksObtained]) => ({
                studentId,
                componentId: marksComponentId,
                marksObtained
            }));

            await api.post("/api/v1/exam/marks", {
                examInstanceId: marksInstanceId,
                subjectId: marksSubjectId,
                marks: marksArray
            });
            toast.success("Marks saved successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to save marks");
        } finally {
            setIsSavingMarks(false);
        }
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
            if (data.errors && data.errors.length > 0) {
                console.warn("Import warnings:", data.errors);
                toast.warning(`Imported with ${data.errors.length} warnings. Check console.`);
            }
            setShowBulkImport(false);
            setImportFile(null);
            if (marksBatchId) fetchStudentsForMarks(marksBatchId);
        } catch (err: any) {
            toast.error(err.message || "Failed to import marks");
        } finally {
            setIsImporting(false);
        }
    };

    const fetchInstanceResults = async (instanceId: string) => {
        if (!instanceId) return;
        setIsLoadingResults(true);
        try {
            const data = await api.get(`/api/v1/exam/instances/${instanceId}/results`);
            setResultsData(data.results || []);
        } catch {
            toast.error("Failed to load results");
        } finally {
            setIsLoadingResults(false);
        }
    };

    useEffect(() => {
        if (selectedResultInstanceId) fetchInstanceResults(selectedResultInstanceId);
    }, [selectedResultInstanceId]);

    useEffect(() => {
        if (marksBatchId) fetchStudentsForMarks(marksBatchId);
    }, [marksBatchId, marksInstanceId, marksSubjectId, marksComponentId]);

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
                                    onClick={openNewSchema}
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
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="text-[10px] font-bold text-[#1C1C1A]/30 bg-[#F4F2EB] px-2 py-1 rounded-lg">
                                                        {schema._count?.subjects || 0} subjects
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => openEditSchema(schema)}
                                                            className="text-[10px] font-bold text-[#1C1C1A]/40 hover:text-[#1C1C1A] flex items-center gap-1 transition-colors"
                                                        >
                                                            <PenLine size={10} /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => { setMappingSchemaId(schema.id); setShowSubjectMapper(true); }}
                                                            className="text-[10px] font-bold text-brand-green hover:underline flex items-center gap-1"
                                                        >
                                                            <Plus size={10} /> Map
                                                        </button>
                                                    </div>
                                                </div>
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
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {inst.marksDeadline && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${new Date() > new Date(inst.marksDeadline) ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                                                                    Deadline: {new Date(inst.marksDeadline).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {inst.marksEntryClosed && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-bold">
                                                                    ENTRY CLOSED
                                                                </span>
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
                                                            disabled={isUpdatingStatus === inst.id}
                                                            className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            {isUpdatingStatus === inst.id ? <Loader2 size={12} className="animate-spin" /> : null}
                                                            {isUpdatingStatus === inst.id ? "Activating..." : "Activate"}
                                                        </button>
                                                    )}
                                                    {inst.status === 'ACTIVE' && (
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => handleCalculateResults(inst.id)}
                                                                disabled={isCalculating === inst.id}
                                                                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                            >
                                                                {isCalculating === inst.id ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                {isCalculating === inst.id ? "Calculating..." : "Calculate"}
                                                            </button>
                                                            
                                                            <button
                                                                onClick={() => handleStatusTransition(inst.id, undefined, !inst.marksEntryClosed)}
                                                                disabled={isUpdatingStatus === inst.id}
                                                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 ${inst.marksEntryClosed ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}
                                                            >
                                                                {isUpdatingStatus === inst.id ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                {inst.marksEntryClosed ? "Reopen Entry" : "Close Entry"}
                                                            </button>

                                                            <button
                                                                onClick={() => handleStatusTransition(inst.id, 'LOCKED')}
                                                                disabled={isUpdatingStatus === inst.id}
                                                                className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                            >
                                                                {isUpdatingStatus === inst.id ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                {isUpdatingStatus === inst.id ? "Locking..." : "Lock"}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {inst.status === 'LOCKED' && (
                                                    <button
                                                        onClick={() => handlePublishResults(inst.id)}
                                                        disabled={isPublishing === inst.id}
                                                        className="px-3 py-1.5 text-xs font-bold text-white bg-brand-green rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {isPublishing === inst.id ? <Loader2 size={12} className="animate-spin" /> : null}
                                                        {isPublishing === inst.id ? "Publishing..." : "Publish"}
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

                    {activeTab === 'marks' && (
                        <div className="space-y-6">
                            {/* Marks Entry Filter Bar */}
                            <div className="bg-white/70 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6 shadow-sm space-y-6">
                                {/* Row 1: Core Selection */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Batch</label>
                                        <select 
                                            value={marksBatchId}
                                            onChange={(e) => {
                                                const bId = e.target.value;
                                                setMarksBatchId(bId);
                                                const b = batches.find(b => b.id === bId);
                                                if (b) {
                                                    setMarksSemester(b.currentSemester);
                                                    
                                                    // Directly get from batch object if backend included it
                                                    const sId = b.branch?.schoolId || b.branch?.school?.id || "";
                                                    const brId = b.branchId || b.branch?.id || "";
                                                    
                                                    // Fallback to allBranches if direct nested data is missing
                                                    if (!sId && brId && allBranches.length > 0) {
                                                        const foundBr = allBranches.find(br => br.id === brId);
                                                        setMarksSchoolId(foundBr?.schoolId || "");
                                                    } else {
                                                        setMarksSchoolId(sId);
                                                    }
                                                    
                                                    setMarksBranchId(brId);
                                                }
                                                setMarksSubjectId("");
                                                setMarksComponentId("");
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="">Select Batch</option>
                                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Semester</label>
                                        <select 
                                            value={marksSemester}
                                            onChange={(e) => {
                                                setMarksSemester(parseInt(e.target.value) || "");
                                                setMarksSubjectId("");
                                                setMarksComponentId("");
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="">Sem</option>
                                            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Exam</label>
                                        <select 
                                            value={marksInstanceId}
                                            onChange={(e) => {
                                                setMarksInstanceId(e.target.value);
                                                setMarksSubjectId("");
                                                setMarksComponentId("");
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="">Select Exam</option>
                                            {instances.filter(i => i.batch?.id === marksBatchId && i.semester === marksSemester).map(i => (
                                                <option key={i.id} value={i.id}>
                                                    {i.name} ({i.status}{i.marksEntryClosed ? ' - CLOSED' : ''})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 2: Drilldown Selection */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">School</label>
                                        <select 
                                            value={marksSchoolId}
                                            onChange={(e) => {
                                                setMarksSchoolId(e.target.value);
                                                setMarksBranchId("");
                                                setMarksSubjectId("");
                                                setMarksComponentId("");
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="">Select School</option>
                                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Branch</label>
                                        <select 
                                            value={marksBranchId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setMarksBranchId(val);
                                                
                                                // Sync batch ID to the specific one for this branch
                                                const currentBatch = batches.find(b => b.id === marksBatchId);
                                                const actualBatch = batches.find(b => b.name === currentBatch?.name && (b.branchId === val || b.branch?.id === val));
                                                if (actualBatch) setMarksBatchId(actualBatch.id);
                                                
                                                setMarksSubjectId("");
                                                setMarksComponentId("");
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="">Select Branch</option>
                                            {filteredBranchOptions.map(br => (
                                                <option key={br.id} value={br.id}>{br.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Subject</label>
                                        <select 
                                            value={marksSubjectId}
                                            onChange={(e) => {
                                                setMarksSubjectId(e.target.value);
                                                setMarksComponentId("");
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.filter(s => {
                                                const semNum = s.semesterNumber || s.semester?.semesterNumber;
                                                const brId = s.branchId || s.semester?.branchId;
                                                return String(brId) === String(marksBranchId) && Number(semNum) === Number(marksSemester);
                                            }).map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Evaluation Part</label>
                                        <select 
                                            value={marksComponentId}
                                            onChange={(e) => setMarksComponentId(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="">Select Part</option>
                                            <option value="INTERNAL_GROUP">Internal Evaluations (Midsem, Quiz, Assign, Attd)</option>
                                            <option value="EXTERNAL_GROUP">External Evaluation (End Semester)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Marks Entry Table */}
                            {!marksInstanceId || !marksSubjectId || !marksComponentId ? (
                                <div className="bg-white/40 border border-dashed border-[#1C1C1A]/10 rounded-3xl p-20 text-center">
                                    <PenLine size={48} className="mx-auto mb-4 text-[#1C1C1A]/10" />
                                    <h3 className="text-lg font-bold text-[#1C1C1A]/40 italic font-serif">Awaiting Configuration</h3>
                                    <p className="text-xs text-[#1C1C1A]/30 mt-1 uppercase tracking-widest font-black">Select Exam, Subject, and Component to start entering marks.</p>
                                </div>
                            ) : isLoadingStudents ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-brand-green" size={32} />
                                </div>
                            ) : (marksComponentId === 'INTERNAL_GROUP' || marksComponentId === 'EXTERNAL_GROUP') ? (
                                <div className="bg-brand-green/5 border border-brand-green/20 rounded-3xl p-12 text-center">
                                    <Layers size={48} className="mx-auto mb-4 text-brand-green/50" />
                                    <h3 className="text-xl font-bold text-[#1C1C1A] font-serif">Outcome-Based Evaluation</h3>
                                    <p className="text-sm text-[#1C1C1A]/60 mt-2 max-w-md mx-auto">This evaluation requires detailed CO-PO mapping and question-wise marks. Please use the Bulk Import feature to download the multi-sheet template and upload marks.</p>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setImportType(marksComponentId);
                                            setShowBulkImport(true);
                                        }}
                                        className="mt-6 px-8 py-3 bg-brand-green text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-brand-green/20 flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <FileText size={16} /> Open Upload & Download Panel
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="bg-white border border-[#1C1C1A]/5 rounded-3xl overflow-hidden shadow-xl">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-[#F4F2EB] border-b border-[#1C1C1A]/5">
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Roll Number</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Student Name</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Marks Obtained</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1C1C1A]/5">
                                            {students.map(student => (
                                                <tr key={student.id} className="hover:bg-[#F4F2EB]/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-black text-[#1C1C1A]/40 font-mono uppercase tracking-tighter">{student.rollNumber || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-[#1C1C1A]">{student.fullName}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input 
                                                                type="number"
                                                                value={marksInput[student.id] ?? ""}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    const max = schemas.find(sch => sch.id === subjects.find(s => s.id === marksSubjectId)?.examSchemaId)?.components.find(c => c.id === marksComponentId)?.maxMarks || 100;
                                                                    if (val > max) { toast.error(`Max marks is ${max}`); return; }
                                                                    setMarksInput({ ...marksInput, [student.id]: val });
                                                                }}
                                                                className="w-20 px-3 py-2 bg-[#F4F2EB] border border-[#1C1C1A]/5 rounded-xl text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition-all"
                                                                placeholder="0.0"
                                                            />
                                                            <span className="text-[10px] font-black text-[#1C1C1A]/20 uppercase">/ {schemas.find(sch => sch.id === subjects.find(s => s.id === marksSubjectId)?.examSchemaId)?.components.find(c => c.id === marksComponentId)?.maxMarks}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-6 bg-[#F4F2EB] flex justify-between items-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">
                                            {students.length} Students Listed
                                        </div>
                                        <div className="flex gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowBulkImport(true)}
                                                className="px-6 py-3 bg-white border border-[#1C1C1A]/10 text-[#1C1C1A] rounded-2xl text-sm font-bold shadow-sm hover:bg-[#F4F2EB] flex items-center gap-2"
                                            >
                                                <Layers size={16} />
                                                Bulk Import
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSaveMarks}
                                                disabled={isSavingMarks || instances.find(i => i.id === marksInstanceId)?.status !== 'ACTIVE' || instances.find(i => i.id === marksInstanceId)?.marksEntryClosed}
                                                className="px-8 py-3 bg-brand-green text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-brand-green/20 flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                                            >
                                                {isSavingMarks ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                Save Marksheet
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="space-y-6">
                            <div className="bg-white/70 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                                        <BarChart3 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-[#1C1C1A]">Performance Registry</h3>
                                        <p className="text-[10px] text-[#1C1C1A]/40 uppercase tracking-widest font-black">View and verify calculated student grades</p>
                                    </div>
                                </div>
                                <select 
                                    value={selectedResultInstanceId}
                                    onChange={(e) => setSelectedResultInstanceId(e.target.value)}
                                    className="px-4 py-2 rounded-xl border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                >
                                    <option value="">Select Calculated Exam</option>
                                    {instances.filter(i => i.status !== 'DRAFT').map(i => (
                                        <option key={i.id} value={i.id}>{i.name} (Sem {i.semester})</option>
                                    ))}
                                </select>
                            </div>

                            {!selectedResultInstanceId ? (
                                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-16 text-center">
                                    <BarChart3 size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                                    <h3 className="text-lg font-bold text-[#1C1C1A]/60 mb-2">Results Ledger</h3>
                                    <p className="text-sm text-[#1C1C1A]/40 max-w-md mx-auto">
                                        Select an exam instance to view detailed student performance metrics.
                                    </p>
                                </div>
                            ) : isLoadingResults ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-brand-green" size={32} />
                                </div>
                            ) : (
                                <div className="bg-white border border-[#1C1C1A]/5 rounded-3xl overflow-hidden shadow-xl overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-[#F4F2EB] border-b border-[#1C1C1A]/5">
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Roll Number</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Student</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Score</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Grade</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1C1C1A]/5">
                                            {resultsData.map((res, i) => (
                                                <tr key={i} className="hover:bg-[#F4F2EB]/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-black text-[#1C1C1A]/40 font-mono tracking-tighter">{res.student?.rollNumber}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-[#1C1C1A]">{res.student?.fullName}</td>
                                                    <td className="px-6 py-4 text-xs font-medium text-[#1C1C1A]/60">{res.subject?.name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm font-bold text-[#1C1C1A]">{res.totalMarks}</div>
                                                        <div className="text-[10px] text-[#1C1C1A]/30">GP: {res.gradePoint}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black mx-auto ${
                                                            res.grade === 'F' ? 'bg-red-100 text-red-600' : 
                                                            res.grade === 'O' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {res.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${res.status === 'PASSED' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {res.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Grading Scale Info */}
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
                        onClick={closeSchemaBuilder}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-[#1C1C1A]/5 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-[#1C1C1A] mb-6">{editingSchemaId ? "Edit Exam Schema" : "Build Exam Schema"}</h2>

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

                                    <div className="space-y-3">
                                        {schemaComponents.map((comp, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex items-center gap-2 bg-[#F4F2EB] rounded-xl p-3">
                                                    <GripVertical size={14} className="text-[#1C1C1A]/20 cursor-grab" />
                                                    <input
                                                        value={comp.name}
                                                        onChange={(e) => updateComponent(i, 'name', e.target.value)}
                                                        placeholder="Component name"
                                                        className="flex-1 px-3 py-2 rounded-lg border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={comp.maxMarks}
                                                        onChange={(e) => updateComponent(i, 'maxMarks', e.target.value)}
                                                        className="w-20 px-3 py-2 rounded-lg border border-[#1C1C1A]/10 bg-white text-xs text-center font-bold focus:outline-none focus:border-brand-green"
                                                    />
                                                    <select
                                                        value={comp.category}
                                                        onChange={(e) => updateComponent(i, 'category', e.target.value)}
                                                        className="w-28 px-2 py-2 rounded-lg border border-[#1C1C1A]/10 bg-white text-xs font-bold focus:outline-none focus:border-brand-green"
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
                                    onClick={closeSchemaBuilder}
                                    className="px-5 py-2.5 text-sm font-bold text-[#1C1C1A]/50 hover:text-[#1C1C1A] rounded-xl hover:bg-[#F4F2EB] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSchema}
                                    disabled={!isValidTotal || !schemaName.trim() || isCreatingSchema}
                                    className="px-5 py-2.5 bg-[#1C1C1A] text-white text-sm font-bold rounded-xl hover:bg-[#2C2C2A] transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isCreatingSchema ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {isCreatingSchema ? (editingSchemaId ? "Updating..." : "Creating...") : (editingSchemaId ? "Update Schema" : "Create Schema")}
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

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Marks Entry Deadline</label>
                                    <input
                                        type="date"
                                        value={instanceDeadline}
                                        onChange={(e) => setInstanceDeadline(e.target.value)}
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
                                    disabled={!instanceName.trim() || !instanceBatchId || isCreatingInstance}
                                    className="px-5 py-2.5 bg-[#1C1C1A] text-white text-sm font-bold rounded-xl hover:bg-[#2C2C2A] transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isCreatingInstance ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {isCreatingInstance ? "Creating Exam..." : "Create Exam"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── SUBJECT MAPPER MODAL ───────────────────────────────────────── */}
            <AnimatePresence>
                {showSubjectMapper && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowSubjectMapper(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-[#1C1C1A]/5 max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-[#1C1C1A]">Bulk Subject Mapping</h2>
                                <p className="text-sm text-[#1C1C1A]/40">Assign <span className="font-bold text-[#1C1C1A]">{schemas.find(s => s.id === mappingSchemaId)?.name}</span> to subjects.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-6">
                                {subjects.map(subject => (
                                    <div 
                                        key={subject.id} 
                                        onClick={() => {
                                            setSelectedSubjects(prev => 
                                                prev.includes(subject.id) 
                                                    ? prev.filter(id => id !== subject.id) 
                                                    : [...prev, subject.id]
                                            );
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                            selectedSubjects.includes(subject.id)
                                                ? 'bg-brand-green/5 border-brand-green shadow-sm'
                                                : 'bg-white border-[#1C1C1A]/5 hover:border-[#1C1C1A]/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                                selectedSubjects.includes(subject.id) ? 'bg-brand-green border-brand-green' : 'border-[#1C1C1A]/10'
                                            }`}>
                                                {selectedSubjects.includes(subject.id) && <Check size={12} className="text-white" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#1C1C1A]">{subject.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest">{subject.code}</span>
                                                    <span className="text-[#1C1C1A]/10">•</span>
                                                    <span className="text-[10px] text-[#1C1C1A]/40 font-bold">{subject.semester?.branch?.name} — Sem {subject.semester?.semesterNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {subject.examSchemaId && (
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                                                subject.examSchemaId === mappingSchemaId ? 'bg-brand-green/10 text-brand-green' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                {subject.examSchemaId === mappingSchemaId ? 'Currently Assigned' : 'Replaces Existing'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-[#1C1C1A]/5">
                                <div className="text-xs font-bold text-[#1C1C1A]/40">
                                    {selectedSubjects.length} subjects selected
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowSubjectMapper(false)}
                                        className="px-5 py-2.5 text-sm font-bold text-[#1C1C1A]/50 hover:text-[#1C1C1A] rounded-xl hover:bg-[#F4F2EB] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleMapSchemaToSubjects}
                                        disabled={selectedSubjects.length === 0 || isMappingSchema}
                                        className="px-8 py-2.5 bg-[#1C1C1A] text-white text-sm font-bold rounded-xl hover:bg-[#2C2C2A] transition-colors disabled:opacity-50 shadow-lg flex items-center gap-2"
                                    >
                                        {isMappingSchema ? <Loader2 size={16} className="animate-spin" /> : null}
                                        {isMappingSchema ? "Applying Mapping..." : "Apply Mapping"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Import Modal */}
            <AnimatePresence>
                {showBulkImport && (
                    <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-serif font-bold text-[#1C1C1A]">Bulk Import Marks</h2>
                                    <button onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-[#F4F2EB] rounded-full transition-colors">
                                        <X size={20} className="text-[#1C1C1A]/40" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Import Type</label>
                                        <select 
                                            value={importType}
                                            onChange={(e) => setImportType(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm font-bold focus:outline-none focus:border-brand-green"
                                        >
                                            <option value="INTERNAL_GROUP">Theory Internal Group (All 4 parts)</option>
                                            <option value="MID_SEM">Mid Semester (Question-wise)</option>
                                            <option value="QUIZ">Quiz / Assignment (CO-wise)</option>
                                            <option value="LAB">Lab Marks (Final)</option>
                                            <option value="EXTERNAL_GROUP">End Semester (External)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 block ml-1">Select Excel File</label>
                                        <div className="relative group">
                                            <input 
                                                type="file" 
                                                accept=".xlsx,.xls,.csv"
                                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className={`w-full px-4 py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${importFile ? 'border-brand-green bg-brand-green/5' : 'border-[#1C1C1A]/10 bg-[#F4F2EB]/50 group-hover:border-[#1C1C1A]/20'}`}>
                                                <Layers className={importFile ? 'text-brand-green' : 'text-[#1C1C1A]/20'} size={32} />
                                                <span className="text-sm font-bold text-[#1C1C1A]">{importFile ? importFile.name : 'Click to select or drag Excel file'}</span>
                                                <span className="text-[10px] text-[#1C1C1A]/40 uppercase tracking-widest">Excel files only (.xlsx) (Max 5MB)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {(importType === 'INTERNAL_GROUP' || importType === 'EXTERNAL_GROUP') && (
                                        <button
                                            onClick={() => {
                                                const batch = batches.find(b => b.id === marksBatchId);
                                                const sub = subjects.find(s => s.id === marksSubjectId);
                                                if(importType === 'INTERNAL_GROUP') {
                                                    downloadInternalTemplate(batch?.name || 'Batch', 'School Name', sub?.name || 'Subject', String(marksSemester), students);
                                                } else {
                                                    downloadExternalTemplate(batch?.name || 'Batch', 'School Name', sub?.name || 'Subject', String(marksSemester), students);
                                                }
                                            }}
                                            className="w-full py-3 bg-[#F4F2EB] text-[#1C1C1A] border border-[#1C1C1A]/10 rounded-2xl text-sm font-bold hover:bg-[#EAE8E0] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Download size={16} />
                                            Download OBE Template for {importType === 'INTERNAL_GROUP' ? 'Internal' : 'External'}
                                        </button>
                                    )}
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                                    <FileText size={20} className="text-blue-600 mt-1" />
                                    <div className="text-xs text-blue-700 leading-relaxed">
                                        <p className="font-bold mb-1">Upload Format Requirements:</p>
                                        {importType === 'INTERNAL_GROUP' && <p>Requires 4 sheets: MID SEMESTER, QUIZ TEST, ASSIGNMENT, ATTENDANCE</p>}
                                        {importType === 'EXTERNAL_GROUP' && <p>Requires 1 sheet: end sem</p>}
                                        {importType !== 'INTERNAL_GROUP' && importType !== 'EXTERNAL_GROUP' && <p>Columns: Roll Number, Marks</p>}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowBulkImport(false)}
                                        className="flex-1 py-4 bg-[#F4F2EB] text-[#1C1C1A] rounded-2xl text-sm font-bold hover:bg-[#EAE8E0] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleBulkImport}
                                        disabled={isImporting || !importFile}
                                        className="flex-[2] py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold hover:bg-[#2C2C2A] transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                        {isImporting ? "Processing..." : "Start Import"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
