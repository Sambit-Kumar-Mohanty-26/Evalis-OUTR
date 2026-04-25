"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Layers, ChevronRight, Plus, Trash2, Settings2, GraduationCap, 
  X, Check, Zap, Info, RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface Subject { id: string; name: string; code: string; creditHours: number; maxMarks: number; }
interface Semester { id: string; semesterNumber: number; subjects: Subject[]; }
interface Branch { id: string; name: string; orgNodeId?: string | null; semesters: Semester[]; }
interface School { id: string; name: string; orgNodeId?: string | null; branches: Branch[]; }
interface Program { id: string; name: string; durationYears: number; orgNodeId?: string | null; schools: School[]; }
interface Version { id: string; name: string; isCurrent: boolean; programs: Program[]; }
interface OrgNode { id: string; name: string; level: number; durationYears?: number; }

export default function AcademicsPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [structure, setStructure] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([]);
  
  // Modal Context
  const [activeModal, setActiveModal] = useState<"VERSION" | "PROGRAM" | "SCHOOL" | "BRANCH" | "SEMESTER" | "SUBJECT" | null>(null);
  const [modalCtx, setModalCtx] = useState<any>({});
  
  // Smart Sync State
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [syncMapping, setSyncMapping] = useState<Record<string, { enabled: boolean, duration: number, name: string }>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);

  // Stable Data Fetchers
  const fetchVersions = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/academic/versions");
      const data = res || [];
      setVersions(data);
      if (data.length > 0 && !selectedVersionId) {
        const current = data.find((v: any) => v.isCurrent) || data[0];
        setSelectedVersionId(current.id);
      }
    } catch (e: any) { 
      if (e.message !== "Request failed") toast.error("Communication error with blueprint server");
    }
  }, [selectedVersionId]);

  const fetchOrgNodes = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/org/nodes");
      setOrgNodes(res || []);
    } catch (e) { console.error("Could not reach organization registry", e); }
  }, []);

  const fetchStructure = useCallback(async (versionId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/academic/structure?versionId=${versionId}`);
      // STABILITY: Only set data, do NOT set selection states here to avoid loops
      setStructure(res);
    } catch (error) {
      toast.error("Failed to decode architectural DNA");
      setStructure(null);
    } finally {
      setLoading(false);
    }
  }, []); // NO selection dependencies here!

  // Effect: Initial Registry Check
  useEffect(() => { 
    // Small timeout to allow auth headers to stabilize
    const timer = setTimeout(() => {
      fetchVersions(); 
      fetchOrgNodes();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchVersions, fetchOrgNodes]);
  
  // Effect: Load structure when version changes
  useEffect(() => {
    if (selectedVersionId) fetchStructure(selectedVersionId);
  }, [selectedVersionId, fetchStructure]);

  // Effect: Auto-Sync Selections (Downstream stability)
  useEffect(() => {
    if (!structure || !structure.programs || structure.programs.length === 0) {
      if (structure && structure.programs && structure.programs.length === 0) {
        setSelectedProgram(null);
        setSelectedSchool(null);
        setSelectedBranch(null);
      }
      return;
    }

    // 1. Validate Program Selection
    const currentProg = structure.programs.find(p => p.id === selectedProgram);
    if (!currentProg) {
      setSelectedProgram(structure.programs[0].id);
      return; // Stop here, second run will handle school
    }

    // 2. Validate School Selection
    const progSchools = currentProg.schools || [];
    const currentSch = progSchools.find(s => s.id === selectedSchool);
    if (!currentSch && progSchools.length > 0) {
      setSelectedSchool(progSchools[0].id);
      return;
    } else if (progSchools.length === 0) {
      if (selectedSchool !== null) setSelectedSchool(null);
    }

    // 3. Validate Branch Selection
    const schBranches = currentSch?.branches || [];
    const currentBr = schBranches.find(b => b.id === selectedBranch);
    if (!currentBr && schBranches.length > 0) {
      setSelectedBranch(schBranches[0].id);
    } else if (schBranches.length === 0) {
      if (selectedBranch !== null) setSelectedBranch(null);
    }
  }, [structure, selectedProgram, selectedSchool]);

  // Sync Logic Helpers
  const parseYearRange = (name: string): number | null => {
    // Stricter format: CourseName(YYYY-YYYY)
    const match = name.match(/\((\d{4})[-–—](\d{4})\)$/);
    if (match) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      if (end > start) return end - start;
    }
    return null;
  };

  const getSmartDuration = (node: OrgNode): number => {
    if (node.durationYears) return node.durationYears;
    const n = node.name.toUpperCase();
    if (n.includes("MCA") || n.includes("M.TECH") || n.includes("MBA") || n.includes("M.SC") || n.includes("M.A")) return 2;
    if (n.includes("B.TECH") || n.includes("B.E") || n.includes("B.ARCH")) return 4;
    return 4;
  };

  useEffect(() => {
    if (activeModal === "VERSION" && isSyncEnabled) {
      const level1Nodes = orgNodes.filter(n => n.level === 1);
      const mapping: any = {};
      level1Nodes.forEach(n => {
        const nodeDuration = getSmartDuration(n);
        // If we have a calculated duration from the name, filter out nodes that don't match
        const isMatch = calculatedDuration ? nodeDuration === calculatedDuration : true;
        
        mapping[n.id] = { 
          enabled: isMatch, 
          duration: nodeDuration, 
          name: n.name 
        };
      });
      setSyncMapping(mapping);
    }
  }, [activeModal, isSyncEnabled, orgNodes, calculatedDuration]);

  const handleCreate = async (payload: any) => {
    setIsSubmitting(true);
    try {
      let endpoint = "";
      if (activeModal === "VERSION") endpoint = "/api/v1/academic/versions";
      if (activeModal === "PROGRAM") endpoint = "/api/v1/academic/programs";
      if (activeModal === "SCHOOL") endpoint = "/api/v1/academic/schools";
      if (activeModal === "BRANCH") endpoint = "/api/v1/academic/branches";
      if (activeModal === "SEMESTER") endpoint = "/api/v1/academic/semesters";
      if (activeModal === "SUBJECT") endpoint = "/api/v1/academic/subjects";
      
      if (activeModal === "VERSION" && isSyncEnabled) {
        payload.mappingData = Object.entries(syncMapping)
          .filter(([_, v]) => v.enabled)
          .map(([id, v]) => ({ nodeId: id, durationYears: v.duration }));
      }

      const res = await api.post(endpoint, payload);
      toast.success(`${activeModal} finalized successfully`);
      setActiveModal(null);
      setIsSyncEnabled(false);
      
      if (activeModal === "VERSION") {
         await fetchVersions(); 
         if (res.id) setSelectedVersionId(res.id);
      } else if (selectedVersionId) {
         fetchStructure(selectedVersionId);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to finalize configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVersion = async () => {
    if (!selectedVersionId) return;
    
    toast.warning("Clear Entire Blueprint?", {
      description: "This will permanently delete all connected programs, schools, branches, and subjects. This action cannot be undone.",
      action: {
        label: "Clear All",
        onClick: async () => {
          setIsDeleting(true);
          try {
            await api.delete(`/api/v1/academic/versions/${selectedVersionId}`);
            toast.success("Blueprint cleared successfully");
            setSelectedVersionId(null);
            setStructure(null);
            await fetchVersions();
          } catch (error: any) {
            toast.error(error.message || "Failed to clear blueprint");
          } finally {
            setIsDeleting(false);
          }
        }
      },
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 5000
    });
  };

  const handleSyncStructure = async () => {
    if (!selectedVersionId) return;

    toast("Sync with Organization Structure?", {
      description: "This will add new programs/branches from the organization tree and archive any that were removed. Ready to proceed?",
      action: {
        label: "Yes, Sync",
        onClick: async () => {
          setIsSyncing(true);
          try {
            const res = await api.post(`/api/v1/academic/versions/${selectedVersionId}/sync`);
            toast.success("Synchronization Complete", {
              description: `Added: ${res.added}, Updated: ${res.updated}, Archived: ${res.deleted}`
            });
            await fetchStructure(selectedVersionId);
          } catch (error: any) {
            toast.error(error.message || "Failed to sync structure");
          } finally {
            setIsSyncing(false);
          }
        }
      },
      duration: 5000,
    });
  };

  // Safe Selection Derived State
  const currentProgram = useMemo(() => structure?.programs?.find((p) => p.id === selectedProgram), [structure, selectedProgram]);
  const currentSchool = useMemo(() => currentProgram?.schools?.find((s) => s.id === selectedSchool), [currentProgram, selectedSchool]);
  const currentBranch = useMemo(() => currentSchool?.branches?.find((b) => b.id === selectedBranch), [currentSchool, selectedBranch]);

  return (
    <div className="space-y-8 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3D8528]/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

      {/* Header & Global Version Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-2">
             <Layers size={16} className="text-[#3D8528]" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3D8528]">Academic Architect</span>
          </div>
          <h1 className="text-4xl font-serif italic text-[#1C1C1A] mb-2 leading-tight">Academic Blueprint</h1>
          <p className="text-[#1C1C1A]/40 font-serif italic text-sm">
            Design and manage the multi-layered structure of courses, schools, and branches.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <div className="relative bg-white border border-brand-green/20 rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Blueprint:</span>
             <select 
               value={selectedVersionId || ""} 
               onChange={(e) => setSelectedVersionId(e.target.value)}
               className="bg-transparent border-none text-[12px] font-bold text-brand-green focus:ring-0 cursor-pointer outline-none min-w-[140px]"
             >
               {(versions || []).map(v => (
                 <option key={v.id} value={v.id}>{v.name} {v.isCurrent ? '(Active)' : ''}</option>
               ))}
               {(!versions || versions.length === 0) && <option value="">No versions found</option>}
             </select>
          </div>
          {selectedVersionId && (
            <div className="flex items-center gap-2">
              <button 
                  onClick={handleSyncStructure}
                  disabled={isSyncing}
                  className="flex items-center justify-center w-10 h-10 bg-brand-green/5 text-brand-green border border-brand-green/10 rounded-xl hover:bg-brand-green hover:text-white transition-all duration-300 shadow-sm disabled:opacity-50"
                  title="Sync with Organization Structure"
              >
                {isSyncing ? <div className="w-4 h-4 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" /> : <RefreshCw size={16} />}
              </button>
              <button 
                 onClick={handleDeleteVersion}
                 disabled={isDeleting}
                 className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm disabled:opacity-50"
                 title="Clear Blueprint Structure"
              >
                {isDeleting ? <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          )}
          <button 
             onClick={() => { setIsSyncEnabled(false); setActiveModal("VERSION"); }}
             className="flex items-center gap-2 px-6 py-3 bg-[#1C1C1A] text-white rounded-xl hover:bg-brand-green transition-all duration-300 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10"
          >
            <Plus size={14} /> New Version
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
               <div className="flex items-center justify-between ml-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">Programs / Courses</h3>
                  <button onClick={() => { setModalCtx({ versionId: selectedVersionId }); setActiveModal("PROGRAM"); }} 
                          className="text-brand-green hover:text-brand-green-hover px-2 text-[10px] uppercase font-bold tracking-widest hover:underline">+ Add</button>
               </div>
               
               <div className="space-y-2">
                  {loading && !structure ? (
                     <div className="p-8 text-center text-[10px] text-black/20 uppercase animate-pulse font-black">Scanning Matrix...</div>
                  ) : structure?.programs?.length === 0 ? (
                     <div className="p-8 text-center text-[10px] text-black/20 uppercase border border-dashed rounded-2xl border-black/10 bg-white/40">No courses initialized</div>
                  ) : structure?.programs?.map((program: Program) => (
                    <motion.button
                      key={program.id}
                      onClick={() => { 
                        setSelectedProgram(program.id); 
                        // STABILITY: Selection sync effect handles the downstream reset
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                        selectedProgram === program.id 
                          ? "bg-white border-brand-green/20 shadow-xl shadow-[#3D8528]/5" 
                          : "bg-white/40 border-black/5 hover:bg-white/60 hover:border-black/10"
                      )}
                    >
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                            selectedProgram === program.id ? "bg-brand-green text-white shadow-md shadow-brand-green/20" : "bg-white border text-[#1C1C1A]/20 group-hover:text-brand-green/60"
                          )}>
                             <GraduationCap size={18} />
                          </div>
                          <div>
                             <p className="text-[13px] font-bold text-[#1C1C1A]">{program.name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] font-medium text-[#1C1C1A]/40 uppercase tracking-widest">{program.durationYears} Years</p>
                                {program.orgNodeId && (
                                   <span className="px-1.5 py-0.5 bg-brand-green/5 text-brand-green text-[8px] font-black uppercase rounded border border-brand-green/10">Mapped</span>
                                )}
                             </div>
                          </div>
                       </div>
                       <ChevronRight size={16} className={cn(
                         "transition-transform",
                         selectedProgram === program.id ? "text-brand-green translate-x-1" : "text-[#1C1C1A]/10"
                       )} />
                    </motion.button>
                  ))}
               </div>
            </div>

            <AnimatePresence>
            {selectedProgram && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="space-y-4"
               >
                  <div className="flex items-center justify-between ml-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">Academic Schools</h3>
                     <button onClick={() => { setModalCtx({ programId: selectedProgram }); setActiveModal("SCHOOL"); }} 
                             className="text-brand-green hover:text-brand-green-hover px-2 text-[10px] uppercase font-bold tracking-widest hover:underline">+ Add</button>
                  </div>
                  
                  <div className="space-y-2">
                     {!currentProgram?.schools || currentProgram.schools.length === 0 ? (
                         <div className="p-8 text-center text-[10px] text-black/20 uppercase border border-dashed rounded-2xl border-black/10 bg-white/40">No schools established.</div>
                     ) : currentProgram.schools.map((school: School) => (
                       <button
                         key={school.id}
                         onClick={() => setSelectedSchool(school.id)}
                         className={cn(
                           "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                           selectedSchool === school.id 
                             ? "bg-white border-brand-green/20 shadow-md ring-1 ring-brand-green/10" 
                             : "bg-white/40 border-black/5 hover:bg-white/60"
                         )}
                       >
                          <div>
                            <p className={cn("text-[12px] font-bold transition-colors", selectedSchool===school.id ? "text-brand-green" : "text-[#1C1C1A] group-hover:text-brand-green")}>{school.name}</p>
                            {school.orgNodeId && <span className="text-[8px] font-black text-brand-green/40 uppercase tracking-tighter">Mapped to Organization</span>}
                          </div>
                          {selectedSchool === school.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(61,133,40,0.6)]" />}
                       </button>
                     ))}
                  </div>
               </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
            {selectedSchool && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="space-y-4"
               >
                  <div className="flex items-center justify-between ml-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">Specializations / Branches</h3>
                     <button onClick={() => { setModalCtx({ schoolId: selectedSchool }); setActiveModal("BRANCH"); }} 
                             className="text-brand-green hover:text-brand-green-hover px-2 text-[10px] uppercase font-bold tracking-widest hover:underline">+ Add</button>
                  </div>
                  
                  <div className="space-y-2">
                     {!currentSchool?.branches || currentSchool.branches.length === 0 ? (
                         <div className="p-8 text-center text-[10px] text-black/20 uppercase border border-dashed rounded-2xl border-black/10 bg-white/40">No branches mapped.</div>
                     ) : currentSchool.branches.map((branch: Branch) => (
                       <button
                         key={branch.id}
                         onClick={() => setSelectedBranch(branch.id)}
                         className={cn(
                           "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                           selectedBranch === branch.id 
                             ? "bg-white border-brand-green/20 shadow-md ring-1 ring-brand-green/10" 
                             : "bg-white/40 border-black/5 hover:bg-white/60"
                         )}
                       >
                          <div>
                            <p className={cn("text-[12px] font-bold transition-colors", selectedBranch===branch.id ? "text-brand-green" : "text-[#1C1C1A] group-hover:text-brand-green")}>{branch.name}</p>
                            {branch.orgNodeId && <span className="text-[8px] font-black text-brand-green/40 uppercase tracking-tighter">Mapped</span>}
                          </div>
                          {selectedBranch === branch.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(61,133,40,0.6)]" />}
                       </button>
                     ))}
                  </div>
               </motion.div>
            )}
            </AnimatePresence>
         </div>

         <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
               {loading && !structure ? (
                  <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center justify-center min-h-[50vh]">
                     <div className="w-8 h-8 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                  </motion.div>
               ) : selectedBranch ? (
                 <motion.div
                   key={selectedBranch}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-6"
                 >
                    <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-md border border-brand-green/10 rounded-2xl shadow-sm">
                       <div className="flex items-center gap-3 px-4">
                          <BookOpen size={16} className="text-[#3D8528]" />
                          <p className="text-[11px] font-black uppercase tracking-widest text-[#1C1C1A]/60">Syllabus Explorer</p>
                       </div>
                       <button 
                         onClick={() => { setModalCtx({ branchId: selectedBranch }); setActiveModal("SEMESTER"); }}
                         className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green-hover transition-all text-[10px] uppercase font-black tracking-widest shadow-md shadow-brand-green/20"
                       >
                          <Plus size={14} /> Add Semester
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {!currentBranch?.semesters || currentBranch.semesters.length === 0 ? (
                          <div className="col-span-1 md:col-span-2 py-20 text-center border border-dashed border-black/10 rounded-3xl bg-white/20">
                             <p className="text-xl font-serif italic text-brand-green mb-2">No Semesters Exist</p>
                             <p className="text-xs font-serif italic text-black/40">Add a semester to begin constructing the syllabus for this branch.</p>
                          </div>
                       ) : (
                         (currentBranch?.semesters || []).slice().sort((a,b)=>a.semesterNumber-b.semesterNumber).map((semester: Semester, sIdx: number) => (
                           <motion.div key={semester.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIdx * 0.05 }}>
                              <div className="bg-white/40 backdrop-blur-xl border border-black/5 rounded-[32px] overflow-hidden hover:border-brand-green/20 shadow-sm hover:shadow-xl transition-all duration-500">
                                 <div className="p-4 bg-gradient-to-r from-[#F8F7F4] to-white border-b border-black/5 flex items-center justify-between">
                                    <h4 className="text-[13px] font-black uppercase tracking-tighter text-[#1C1C1A]">Semester {semester.semesterNumber}</h4>
                                    <span className="bg-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-brand-green border border-brand-green/10 shadow-sm">
                                      {semester.subjects?.length || 0} Units
                                    </span>
                                 </div>
                                 <div className="p-4 space-y-3 bg-white/40">
                                    {semester.subjects?.map((subject) => (
                                      <div key={subject.id} className="group relative flex items-center justify-between p-3 bg-white border border-black/5 rounded-xl hover:border-brand-green/30 transition-all shadow-sm">
                                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-green rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                         <div className="space-y-1 pl-1">
                                            <p className="text-[12px] font-bold text-[#1C1C1A]">{subject.name}</p>
                                            <div className="flex items-center gap-2">
                                               <span className="text-[9px] font-black text-[#1C1C1A]/40 uppercase tracking-widest">{subject.code}</span>
                                               <span className="text-[14px] leading-none opacity-20">/</span>
                                               <span className="text-[9px] font-black text-brand-green uppercase tracking-widest">{subject.creditHours} Credits</span>
                                            </div>
                                         </div>
                                         <div className="flex flex-col items-end gap-2 text-right">
                                             <span className="text-[9px] text-[#1C1C1A]/20 font-black uppercase">{subject.maxMarks} Mk</span>
                                         </div>
                                      </div>
                                    ))}
                                    <button 
                                        onClick={() => { setModalCtx({ semesterId: semester.id }); setActiveModal("SUBJECT"); }}
                                        className="w-full py-3 border border-dashed border-black/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 hover:bg-brand-green/5 hover:text-brand-green hover:border-brand-green/30 transition-all shadow-sm"
                                    >
                                       + Map Subject
                                    </button>
                                 </div>
                              </div>
                           </motion.div>
                         ))
                       )}
                    </div>
                 </motion.div>
               ) : (
                 <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center justify-center py-40 bg-white/40 border border-dashed border-black/10 rounded-[40px] text-center space-y-4">
                    <div className="w-20 h-20 bg-white shadow-xl rounded-[30px] flex items-center justify-center border border-black/5">
                       <Layers size={32} className="text-brand-green/30" />
                    </div>
                    <div className="max-w-sm">
                       <h3 className="text-3xl font-serif italic text-[#1C1C1A] mb-2">Blueprint Explorer</h3>
                       <p className="text-sm font-serif italic text-[#1C1C1A]/40">Select or create courses, schools, and branches to map out your academic DNA.</p>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Modal Engine (Fixed Sync Interface) */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
               onClick={() => setActiveModal(null)}
               className="fixed inset-0 bg-[#1A2B3D]/30 backdrop-blur-md z-50" 
            />
            <motion.div 
               initial={{ x: "100%", opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0.5 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#F4F2EB] border-l border-white/50 shadow-2xl z-[60] flex flex-col"
            >
               <div className="p-8 border-b border-black/5 bg-white/40 backdrop-blur-xl flex items-center justify-between">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-1">Configuration</h3>
                    <h2 className="text-2xl font-serif text-[#1C1C1A]">Add New {activeModal.charAt(0) + activeModal.slice(1).toLowerCase()}</h2>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-2 bg-white hover:bg-black/5 rounded-full border border-black/5 transition-all shadow-sm text-black/40 hover:text-black">
                    <X size={16} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 bg-white/20">
                  <form onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     const payload: any = Object.fromEntries(formData.entries());
                     
                     if (payload.durationYears) payload.durationYears = parseInt(payload.durationYears);
                     if (payload.semesterNumber) payload.semesterNumber = parseInt(payload.semesterNumber);
                     if (payload.creditHours) payload.creditHours = parseInt(payload.creditHours);
                     if (payload.maxMarks) payload.maxMarks = parseInt(payload.maxMarks);
                     payload.isCurrent = payload.isCurrent === 'on';

                     if (activeModal === "PROGRAM") payload.versionId = modalCtx.versionId;
                     if (activeModal === "SCHOOL") payload.programId = modalCtx.programId;
                     if (activeModal === "BRANCH") payload.schoolId = modalCtx.schoolId;
                     if (activeModal === "SEMESTER") payload.branchId = modalCtx.branchId;
                     if (activeModal === "SUBJECT") payload.semesterId = modalCtx.semesterId;

                     handleCreate(payload);
                  }} className="space-y-6">
                     
                     {activeModal === "VERSION" && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Blueprint Name</label>
                            <input 
                              name="name" 
                              required 
                              placeholder="e.g. B.Tech(2023-2027)" 
                              pattern="^.+\(\d{4}-\d{4}\)$"
                              title="Format: CourseName(YYYY-YYYY)"
                              onChange={(e) => {
                                const dur = parseYearRange(e.target.value);
                                setCalculatedDuration(dur);
                              }}
                              className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" 
                            />
                          </div>
                          
                          <div className="flex flex-col gap-3 p-4 bg-white border border-black/5 rounded-3xl shadow-sm">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <Zap size={14} className="text-brand-green" />
                                   <span className="text-[11px] font-black uppercase tracking-widest text-[#1C1C1A]">Smart Sync</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={isSyncEnabled} onChange={(e) => setIsSyncEnabled(e.target.checked)} className="sr-only peer" />
                                  <div className="w-9 h-5 bg-black/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-green"></div>
                                </label>
                             </div>
                             <p className="text-[9px] font-medium text-[#1C1C1A]/40 leading-relaxed">Automatically generate your academic hierarchy from the current organizational structure.</p>
                          </div>

                          <AnimatePresence>
                             {isSyncEnabled && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden space-y-4"
                                >
                                   <div className="flex items-center gap-2 px-2 py-1 bg-brand-green/5 rounded-lg">
                                      <Info size={12} className="text-brand-green" />
                                      <span className="text-[9px] font-bold uppercase tracking-tighter text-brand-green/60">Confirm Syllabus Durations</span>
                                   </div>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                       {Object.entries(syncMapping).map(([id, item]) => {
                                          const isMismatch = calculatedDuration !== null && item.duration !== calculatedDuration;
                                          return (
                                            <div key={id} className={cn(
                                                "p-4 rounded-2xl border transition-all flex items-center justify-between gap-4", 
                                                item.enabled ? "bg-white border-brand-green/20 shadow-sm" : "bg-black/5 border-transparent opacity-50",
                                                isMismatch && "opacity-30 grayscale pointer-events-none"
                                            )}>
                                               <div className="flex items-center gap-3">
                                                  <input 
                                                     type="checkbox" 
                                                     checked={item.enabled && !isMismatch} 
                                                     disabled={isMismatch}
                                                     onChange={(e) => setSyncMapping(prev => ({ ...prev, [id]: { ...prev[id], enabled: e.target.checked } }))}
                                                     className="w-4 h-4 rounded border-black/10 text-brand-green focus:ring-brand-green"
                                                  />
                                                  <span className="text-[12px] font-bold text-[#1C1C1A]">{item.name}</span>
                                               </div>
                                               <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-xl border border-black/5">
                                                  <span className="text-[11px] font-black text-brand-green">{item.duration}</span>
                                                  <span className="text-[9px] font-black text-[#1C1C1A]/30 uppercase">Yrs</span>
                                               </div>
                                            </div>
                                          );
                                       })}
                                    </div>
                                </motion.div>
                             )}
                          </AnimatePresence>

                          <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-black/5 rounded-2xl">
                              <input type="checkbox" name="isCurrent" className="w-4 h-4 text-brand-green border-black/20 focus:ring-brand-green rounded outline-none" />
                             <span className="text-xs font-bold text-[#1C1C1A]">Mark as Active Batch (Multiple Allowed)</span>
                          </label>
                        </>
                     )}

                     {activeModal === "PROGRAM" && (
                         <>
                           <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Course Name</label>
                            <input name="name" required placeholder="e.g. Bachelor of Technology" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Duration (Years)</label>
                            <input name="durationYears" type="number" min={1} max={10} required placeholder="e.g. 4" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Map to Organization (Course Level)</label>
                             <select name="orgNodeId" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[12px] font-bold outline-none">
                                <option value="">No Mapping</option>
                                {orgNodes.filter(n => n.level === 1).map(n => (
                                   <option key={n.id} value={n.id}>{n.name}</option>
                                ))}
                             </select>
                          </div>
                        </>
                     )}

                     {activeModal === "SCHOOL" && (
                        <>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">School Name</label>
                             <input name="name" required placeholder="e.g. School of Engineering" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Map to Org School Node</label>
                              <select name="orgNodeId" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[12px] font-bold outline-none">
                                 <option value="">No Mapping</option>
                                 {orgNodes.filter(n => n.level === 2).map(n => (
                                    <option key={n.id} value={n.id}>{n.name}</option>
                                 ))}
                              </select>
                           </div>
                        </>
                     )}

                     {activeModal === "BRANCH" && (
                        <>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Branch Name</label>
                             <input name="name" required placeholder="e.g. Computer Science Engineering" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Map to Org Branch/Dept</label>
                              <select name="orgNodeId" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[12px] font-bold outline-none">
                                 <option value="">No Mapping</option>
                                 {orgNodes.filter(n => n.level === 3).map(n => (
                                    <option key={n.id} value={n.id}>{n.name}</option>
                                 ))}
                              </select>
                           </div>
                        </>
                     )}

                     {activeModal === "SEMESTER" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Semester Number</label>
                          <input name="semesterNumber" type="number" min={1} max={20} required placeholder="e.g. 1" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                        </div>
                     )}

                     {activeModal === "SUBJECT" && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject Name</label>
                            <input name="name" required placeholder="e.g. Engineering Mathematics I" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject Code</label>
                            <input name="code" required placeholder="e.g. MATH101" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Credit Hours</label>
                               <input name="creditHours" type="number" min={1} max={20} required placeholder="e.g. 4" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Max Marks</label>
                               <input name="maxMarks" type="number" min={1} max={1000} defaultValue={100} required placeholder="e.g. 100" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                             </div>
                          </div>
                        </>
                     )}

                     <div className="pt-8">
                        <button disabled={isSubmitting} type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-[#1C1C1A] text-white rounded-2xl hover:bg-brand-green transition-all shadow-xl shadow-black/10 group font-bold text-[11px] uppercase tracking-widest disabled:opacity-50">
                           {isSubmitting ? "Finalizing Matrix..." : "Confirm Configuration"}
                           {!isSubmitting && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                     </div>
                  </form>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
