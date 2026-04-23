"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, Cloud, CloudOff, RefreshCw, CheckCircle2,
  AlertCircle, HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { HierarchyFlow, OrgNode } from "@/components/dashboard/HierarchyFlow";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// CUSTOM HOOK FOR DEBOUNCED SYNC
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function OrganizationPage() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error" | "offline">("synced");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Critical safety flags
  const isInitialMount = useRef(true);
  const syncLockdown = useRef(false); // If true, prevent all auto-sync calls
  const prevNodesJson = useRef("");

  const fetchNodes = async () => {
    try {
      setLoading(true);
      syncLockdown.current = true; // Lock sync during fetch

      const res = await api.get<any[]>("/api/v1/org/nodes");
      
      // FIX: api.get returns the array directly. No .data property.
      const fetchedNodes = (res || []).map((n: any) => ({
        ...n,
        localKey: n.id,
        collapsed: n.isCollapsed || false
      }));

      setNodes(fetchedNodes);
      prevNodesJson.current = JSON.stringify(fetchedNodes);
      syncLockdown.current = false; // Unlock only on SUCCESS
    } catch (e: any) {
      console.error("Fetch Nodes Error:", e);
      toast.error("Failed to load institutional hierarchy. Auto-sync disabled for safety.");
      setSyncStatus("offline");
      syncLockdown.current = true; // Keep lock to prevent accidental wipes
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  };

  useEffect(() => { fetchNodes(); }, []);

  // AUTO-SYNC LOGIC
  const debouncedNodes = useDebounce(nodes, 2000);

  const syncToCloud = useCallback(async (nodesToSync: OrgNode[]) => {
    if (syncLockdown.current) {
        console.warn("Sync blocked: System is in lockdown mode (Fetch Error or Mounting).");
        return;
    }

    // Safety: Never auto-sync an empty list if we know we previously had nodes.
    if (nodesToSync.length === 0 && prevNodesJson.current !== "[]" && prevNodesJson.current !== "") {
        console.warn("Sync blocked: Prevented accidental hierarchy wipe.");
        return;
    }
    
    setSyncStatus("saving");
    try {
      await api.put("/api/v1/org/sync", { nodes: nodesToSync });
      prevNodesJson.current = JSON.stringify(nodesToSync);
      setSyncStatus("synced");
      setLastSaved(new Date());
    } catch (e) {
      setSyncStatus("error");
      toast.error("Sync failed. Check your connection.");
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current || loading || syncLockdown.current) return;

    const currentJson = JSON.stringify(debouncedNodes);
    const realTimeJson = JSON.stringify(nodes);

    // Only sync if the debounced state has actually changed and matched current user input
    if (currentJson === realTimeJson && currentJson !== prevNodesJson.current) {
        syncToCloud(debouncedNodes);
    }
  }, [debouncedNodes, nodes, syncToCloud, loading]);

  // Handle immediate visual changes
  const handleNodesChange = (updatedNodes: OrgNode[]) => {
    setNodes(updatedNodes);
    if (syncStatus === "synced") setSyncStatus("saving");
  };

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600/10 border border-indigo-600/10">
                <Network size={12} className="text-indigo-600" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600">Institutional DNA</span>
             </div>
             
             {/* Sync Badge */}
             <AnimatePresence mode="wait">
               {syncStatus === "saving" && (
                 <motion.div 
                   key="saving"
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/10"
                 >
                   <RefreshCw size={10} className="text-amber-600 animate-spin" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Synchronizing...</span>
                 </motion.div>
               )}
               {syncStatus === "synced" && (
                 <motion.div 
                   key="synced"
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10"
                 >
                   <CheckCircle2 size={10} className="text-emerald-600" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Cloud Synced</span>
                 </motion.div>
               )}
               {(syncStatus === "error" || syncStatus === "offline") && (
                 <div className="flex items-center gap-2">
                   <motion.div 
                     key="error"
                     initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                     className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/10"
                   >
                     <CloudOff size={10} className="text-red-600" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-red-600">
                       {syncStatus === "offline" ? "Sync Locked" : "Sync Error"}
                     </span>
                   </motion.div>
                   {syncStatus === "error" && (
                     <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => syncToCloud(nodes)}
                       className="px-2 py-1 rounded-md bg-white border border-black/5 text-[8px] font-black uppercase tracking-widest text-[#1C1C1A]/60 hover:text-indigo-600 transition-colors shadow-sm"
                     >
                       Retry Sync
                     </motion.button>
                   )}
                 </div>
               )}
             </AnimatePresence>
          </div>
          <h1 className="text-4xl font-serif italic text-[#1C1C1A] mb-2 leading-tight tracking-tight">Hierarchy Flow</h1>
          <p className="text-[#1C1C1A]/40 font-serif italic text-sm">Design your organizational skeleton with cinematic, real-time persistence.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          {lastSaved && (
             <div className="hidden lg:block text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1C1C1A]/20">Last Persistence</p>
                <p className="text-xs font-serif italic text-[#1C1C1A]/40">{lastSaved.toLocaleTimeString()}</p>
             </div>
          )}
          
          <div className="flex items-center gap-4 px-6 py-3 bg-white/60 backdrop-blur-md rounded-2xl border border-black/5 shadow-sm">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-indigo-500/10 flex items-center justify-center">
                    <Cloud size={10} className="text-indigo-600/40" />
                  </div>
                ))}
             </div>
             <div className="h-4 w-px bg-black/5" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/40">Active Nodes:</span>
                <span className="text-xs font-bold text-indigo-600">{nodes.length}</span>
             </div>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
           <div className="relative">
              <div className="w-16 h-16 border-2 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
              <Network size={20} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-8 animate-pulse">Initializing Matrix Flow...</p>
        </div>
      ) : nodes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="py-40 flex flex-col items-center justify-center bg-white/40 border border-dashed border-black/10 rounded-[40px] text-center space-y-6"
        >
            <div className="w-24 h-24 bg-white shadow-2xl rounded-[35px] flex items-center justify-center border border-black/5 relative overflow-hidden group">
               <motion.div 
                 animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
               />
               <Network size={40} className="text-indigo-600/30 relative z-10" />
            </div>
            <div className="max-w-md">
               <h3 className="text-3xl font-serif italic text-[#1C1C1A] mb-3">The Hierarchy matrix is clear.</h3>
               <p className="text-sm font-serif italic text-[#1C1C1A]/40 leading-relaxed px-10">Start by creating your primary institution node. The system will handle the rest with continuous cloud persistence.</p>
            </div>
            <button 
              onClick={() => {
                const rootId = crypto.randomUUID();
                handleNodesChange([{
                  id: rootId,
                  localKey: rootId,
                  parentId: null,
                  name: "Global Institute",
                  type: "Institution",
                  level: 0,
                  collapsed: false,
                  order: 0
                }]);
              }}
              className="px-8 py-3.5 bg-[#1C1C1A] text-white rounded-2xl hover:bg-indigo-600 transition-all font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 flex items-center gap-3"
            >
               Initialize Root DNA
            </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white/40 backdrop-blur-xl border border-black/5 rounded-[40px] shadow-sm overflow-hidden min-h-[600px]"
        >
          <div className="p-4 border-b border-black/5 bg-white/40 flex items-center justify-between">
             <div className="flex items-center gap-3 ml-4">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Active Session</span>
             </div>
             <div className="flex items-center gap-2 mr-4">
                <button className="p-2 hover:bg-black/5 rounded-lg transition-all text-[#1C1C1A]/40" title="Hierarchy Help">
                   <HelpCircle size={16} />
                </button>
                <div className="h-4 w-px bg-black/5" />
                <button onClick={fetchNodes} className="p-2 hover:bg-black/5 rounded-lg transition-all text-[#1C1C1A]/40" title="Refresh Matrix">
                   <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
             </div>
          </div>
          
          <HierarchyFlow 
            nodes={nodes} 
            onNodesChange={handleNodesChange} 
          />
        </motion.div>
      )}

      {/* FOOTER INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: Cloud, title: "Zero Lag", desc: "Changes persist in background without UI blocking." },
           { icon: Network, title: "Recursive DNA", desc: "Infinite depth support for complex institutions." },
           { icon: AlertCircle, title: "Auto Conflict Resolution", desc: "Stable keys ensure tree integrity during sync." },
         ].map((item, i) => (
           <GlassCard key={i} className="p-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/5 flex items-center justify-center text-indigo-600 mb-4">
                 <item.icon size={20} />
              </div>
              <h4 className="text-sm font-bold text-[#1C1C1A] mb-1">{item.title}</h4>
              <p className="text-xs font-serif italic text-[#1C1C1A]/40">{item.desc}</p>
           </GlassCard>
         ))}
      </div>
    </div>
  );
}
