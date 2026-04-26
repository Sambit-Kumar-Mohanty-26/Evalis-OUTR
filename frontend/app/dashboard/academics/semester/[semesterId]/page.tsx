"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Plus, Trash2, BookOpen, Layers, 
  ChevronRight, X, Info, Layout
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Subject { id: string; name: string; code: string; creditHours: number; maxMarks: number; examSchemaId?: string | null; }
interface Semester { id: string; semesterNumber: number; subjects: Subject[]; branch?: { name: string; school?: { name: string } } }
interface ExamSchema { id: string; name: string; type: string; totalMarks: number; }

export default function SemesterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const semesterId = params.semesterId as string;
  
  const [semester, setSemester] = useState<Semester | null>(null);
  const [examSchemas, setExamSchemas] = useState<ExamSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSemesterData = useCallback(async () => {
    try {
      setLoading(true);
      // We fetch subjects for this semester and also get the structure to find the semester details
      const [subjectsRes, structureRes] = await Promise.all([
        api.get(`/api/v1/academic/subjects?semesterId=${semesterId}`),
        api.get("/api/v1/academic/structure?versionId=current")
      ]);

      // Find semester in structure to get branch/school names
      let foundSem: any = null;
      if (structureRes && structureRes.programs) {
        structureRes.programs.forEach((p: any) => {
          p.schools?.forEach((sch: any) => {
            sch.branches?.forEach((br: any) => {
              br.semesters?.forEach((sem: any) => {
                if (sem.id === semesterId) {
                  foundSem = { 
                    ...sem, 
                    branch: { 
                      name: br.name, 
                      school: { name: sch.name } 
                    } 
                  };
                }
              });
            });
          });
        });
      }

      if (foundSem) {
        setSemester({ ...foundSem, subjects: subjectsRes.subjects || [] });
      } else {
        toast.error("Semester not found");
        router.push("/dashboard/academics");
      }
    } catch (error) {
      toast.error("Failed to load semester details");
    } finally {
      setLoading(false);
    }
  }, [semesterId, router]);

  const fetchExamSchemas = useCallback(async () => {
    try {
      const res = await api.get<{ schemas: ExamSchema[] }>("/api/v1/exam/schemas");
      setExamSchemas(res.schemas || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSemesterData();
    fetchExamSchemas();
  }, [fetchSemesterData, fetchExamSchemas]);

  const handleCreateSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    try {
      await api.post("/api/v1/academic/subjects", {
        ...payload,
        semesterId,
        creditHours: parseInt(payload.creditHours as string),
        maxMarks: parseInt(payload.maxMarks as string)
      });
      toast.success("Subject mapped successfully");
      setShowAddModal(false);
      fetchSemesterData();
    } catch (error: any) {
      toast.error(error.message || "Failed to map subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    toast.warning("Delete Subject?", {
      description: "This will permanently remove the subject and all connected marks.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await api.delete(`/api/v1/academic/subjects/${id}`);
            toast.success("Subject removed");
            fetchSemesterData();
          } catch (error: any) {
            toast.error(error.message || "Failed to delete subject");
          }
        }
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <button 
            onClick={() => router.push("/dashboard/academics")}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 hover:text-brand-green transition-all mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Blueprint
          </button>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green shadow-sm">
                <Layers size={24} />
             </div>
             <div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3D8528]">Syllabus Detail</span>
                   <span className="w-1 h-1 rounded-full bg-brand-green/30" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">{semester?.branch?.school?.name}</span>
                </div>
                <h1 className="text-4xl font-serif italic text-[#1C1C1A] leading-tight">
                  Semester {semester?.semesterNumber} <span className="text-brand-green">—</span> {semester?.branch?.name}
                </h1>
             </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-[#1C1C1A] text-white rounded-2xl hover:bg-brand-green transition-all duration-300 font-bold text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/10"
        >
          <Plus size={18} /> Map New Subject
        </motion.button>
      </div>

      {/* Subject Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {semester?.subjects?.length === 0 ? (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-black/5 rounded-[40px] bg-white/40 backdrop-blur-md">
               <div className="w-20 h-20 bg-white shadow-xl rounded-[30px] flex items-center justify-center border border-black/5 mx-auto mb-6">
                  <BookOpen size={32} className="text-brand-green/20" />
               </div>
               <h3 className="text-2xl font-serif italic text-[#1C1C1A] mb-2">No Subjects Mapped</h3>
               <p className="text-sm font-serif italic text-[#1C1C1A]/40 max-w-xs mx-auto">This semester is currently empty. Start building the syllabus by adding your first subject.</p>
            </div>
         ) : (
            semester?.subjects?.map((subject, idx) => (
              <motion.div 
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-white/60 backdrop-blur-xl border border-black/5 rounded-[32px] p-8 hover:border-brand-green/30 hover:shadow-2xl hover:shadow-[#3D8528]/5 transition-all duration-500"
              >
                 <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                       <Trash2 size={16} />
                    </button>
                 </div>

                 <div className="flex flex-col h-full justify-between">
                    <div>
                       <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-brand-green/5 text-brand-green text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-green/10">
                             {subject.code}
                          </span>
                       </div>
                       <h3 className="text-2xl font-serif italic text-[#1C1C1A] mb-6 leading-snug pr-12">{subject.name}</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-black/[0.03]">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#1C1C1A]/30">Credits</p>
                          <p className="text-lg font-bold text-brand-green">{subject.creditHours}</p>
                       </div>
                       <div className="space-y-1 border-x border-black/[0.03] px-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#1C1C1A]/30">Max Marks</p>
                          <p className="text-lg font-bold text-[#1C1C1A]">{subject.maxMarks}</p>
                       </div>
                       <div className="space-y-1 pl-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#1C1C1A]/30">Evaluation</p>
                          <p className="text-[10px] font-bold text-[#1C1C1A]/60 mt-1 uppercase tracking-tight">
                            {subject.examSchemaId ? "Schema Mapped" : "Standard"}
                          </p>
                       </div>
                    </div>
                 </div>
              </motion.div>
            ))
         )}
      </div>

      {/* Add Subject Modal */}
      <AnimatePresence>
         {showAddModal && (
            <>
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setShowAddModal(false)}
                 className="fixed inset-0 bg-[#1A2B3D]/30 backdrop-blur-md z-50"
               />
               <motion.div 
                 initial={{ x: "100%", opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0.5 }}
                 className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#F4F2EB] border-l border-white/50 shadow-2xl z-[60] flex flex-col"
               >
                  <div className="p-8 border-b border-black/5 bg-white/40 backdrop-blur-xl flex items-center justify-between">
                     <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-1">Architectural Entry</h3>
                        <h2 className="text-2xl font-serif text-[#1C1C1A]">Map New Subject</h2>
                     </div>
                     <button onClick={() => setShowAddModal(false)} className="p-2 bg-white hover:bg-black/5 rounded-full border border-black/5 transition-all text-black/40 hover:text-black">
                        <X size={16} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 bg-white/20">
                     <form onSubmit={handleCreateSubject} className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject Name</label>
                           <input name="name" required placeholder="e.g. Data Structures & Algorithms" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject Code</label>
                           <input name="code" required placeholder="e.g. CSE201" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Credit Hours</label>
                              <input name="creditHours" type="number" min={0} required placeholder="4" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Max Marks</label>
                              <input name="maxMarks" type="number" min={1} required placeholder="100" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Evaluation Schema</label>
                           <select name="examSchemaId" className="w-full p-4 bg-white border border-black/5 rounded-2xl text-[12px] font-bold outline-none">
                              <option value="">No Schema Assigned</option>
                              {examSchemas.map(s => (
                                 <option key={s.id} value={s.id}>{s.name} ({s.type} - {s.totalMarks} Mk)</option>
                              ))}
                           </select>
                        </div>

                        <div className="pt-8">
                           <button disabled={isSubmitting} type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-[#1C1C1A] text-white rounded-2xl hover:bg-brand-green transition-all shadow-xl group font-bold text-[11px] uppercase tracking-widest disabled:opacity-50">
                              {isSubmitting ? "Finalizing Matrix..." : "Confirm Subject Mapping"}
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
