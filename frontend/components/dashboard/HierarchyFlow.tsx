"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronRight, Pencil, Building2, FolderTree, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

// DATA MODEL
export interface OrgNode {
  id: string;
  localKey: string; // Stable key for React rendering to prevent flickers
  parentId: string | null;
  name: string;
  type: string;
  level: number;
  collapsed: boolean;
  order: number;
  durationYears?: number;
}

export interface HierarchyFlowProps {
  nodes: OrgNode[];
  onNodesChange: (nodes: OrgNode[]) => void;
}

// LEVEL THEMING
const LEVEL_THEME: Record<number, { 
  dot: string; line: string; bg: string; bgHover: string; 
  border: string; accent: string; badge: string;
}> = {
  0: { dot: "bg-[#3D8528]", line: "bg-[#3D8528]/20", bg: "bg-[#3D8528]", bgHover: "bg-[#3D8528]", border: "border-[#3D8528]/20", accent: "text-white", badge: "bg-[#3D8528]/10 text-[#3D8528]" },
  1: { dot: "bg-[#4A9E30]", line: "bg-[#4A9E30]/15", bg: "bg-white/80", bgHover: "bg-white", border: "border-[#4A9E30]/15", accent: "text-[#1C1C1A]", badge: "bg-[#4A9E30]/10 text-[#4A9E30]" },
  2: { dot: "bg-[#5BB3E0]", line: "bg-[#5BB3E0]/15", bg: "bg-white/60", bgHover: "bg-white/90", border: "border-[#5BB3E0]/15", accent: "text-[#1C1C1A]", badge: "bg-[#5BB3E0]/10 text-[#5BB3E0]" },
  3: { dot: "bg-[#8B7EC8]", line: "bg-[#8B7EC8]/15", bg: "bg-white/40", bgHover: "bg-white/70", border: "border-[#8B7EC8]/15", accent: "text-[#1C1C1A]", badge: "bg-[#8B7EC8]/10 text-[#8B7EC8]" },
  4: { dot: "bg-[#1C1C1A]/30", line: "bg-[#1C1C1A]/8", bg: "bg-white/30", bgHover: "bg-white/60", border: "border-[#1C1C1A]/8", accent: "text-[#1C1C1A]", badge: "bg-[#1C1C1A]/5 text-[#1C1C1A]/50" },
};
const getTheme = (level: number) => LEVEL_THEME[Math.min(level, 4)];

// TREE NODE COMPONENT (RECURSIVE)
interface TreeNodeProps {
  node: OrgNode;
  allNodes: OrgNode[];
  isLast: boolean;
  onAdd: (parentId: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDurationChange: (id: string, duration: number) => void;
  onTypeChange: (id: string, type: string) => void;
  onToggle: (id: string) => void;
}

function TreeNodeItem({ node, allNodes, isLast, onAdd, onRemove, onRename, onDurationChange, onTypeChange, onToggle }: TreeNodeProps) {
  const [editing, setEditing] = useState(false);
  const [editingType, setEditingType] = useState(false);
  const [nameVal, setNameVal] = useState(node.name);
  const [typeVal, setTypeVal] = useState(node.type);
  const inputRef = useRef<HTMLInputElement>(null);

  const theme = getTheme(node.level);
  const isRoot = node.parentId === null;
  const children = allNodes
    .filter(n => n.parentId === node.id)
    .sort((a, b) => a.order - b.order);
  const hasChildren = children.length > 0;

  useEffect(() => { setNameVal(node.name); }, [node.name]);
  useEffect(() => { setTypeVal(node.type); }, [node.type]);

  const commitName = () => {
    setEditing(false);
    if (nameVal.trim() && nameVal.trim() !== node.name) {
       onRename(node.id, nameVal.trim());
    } else {
       setNameVal(node.name);
    }
  };

  const commitType = () => {
    setEditingType(false);
    if (typeVal.trim() && typeVal.trim() !== node.type) {
       onTypeChange(node.id, typeVal.trim());
    } else {
       setTypeVal(node.type);
    }
  };

  return (
    <div className="relative">
      {/* NODE ROW */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="flex items-stretch gap-0 group"
      >
        {/* Tree Branch Connector */}
        {!isRoot && (
          <div className="relative w-8 shrink-0 flex items-center">
            {/* Vertical line (from parent) */}
            <div className={cn("absolute left-3 top-0 w-0.5 rounded-full", theme.line, isLast ? "h-1/2" : "h-full")} />
            {/* Horizontal line (into this node) */}
            <div className={cn("absolute left-3 top-1/2 h-0.5 w-5 rounded-full", theme.line)} />
            {/* Dot at the junction */}
            <div className={cn("absolute left-[9px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-2 ring-white shadow-sm z-10", theme.dot)} />
          </div>
        )}

        {/* THE NODE */}
        <motion.div
          whileHover={{ y: -1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
            isRoot 
              ? `${theme.bg} ${theme.border} ${theme.accent} shadow-lg shadow-[#3D8528]/10` 
              : `${theme.bg} backdrop-blur-xl ${theme.border} ${theme.accent} shadow-sm hover:shadow-md`,
            isRoot && "py-5 px-6"
          )}
          onClick={() => hasChildren && onToggle(node.id)}
        >
          {isRoot && (
            <motion.div
              animate={{ x: [-150, 400] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 pointer-events-none"
            />
          )}

          {hasChildren && (
            <motion.div
              animate={{ rotate: node.collapsed ? 0 : 90 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center shrink-0",
                isRoot ? "bg-white/20" : "bg-[#1C1C1A]/5"
              )}
            >
              <ChevronRight size={12} strokeWidth={2.5} />
            </motion.div>
          )}

          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            isRoot ? "bg-white/20" : theme.badge
          )}>
            {isRoot ? <Building2 size={16} /> : node.level === 1 ? <FolderTree size={14} /> : <GitBranch size={14} />}
          </div>

          <div className="flex-1 min-w-0 relative z-10">
            {editingType ? (
              <input
                autoFocus
                value={typeVal}
                onChange={e => setTypeVal(e.target.value)}
                onBlur={commitType}
                onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitType(); }}
                onClick={e => e.stopPropagation()}
                className={cn("w-full bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-[0.15em]", isRoot ? "text-white/60" : "text-[#1C1C1A]/25")}
              />
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingType(true); }}
                className={cn("text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1 transition-opacity", isRoot ? "text-white/50 hover:text-white/80" : "text-[#1C1C1A]/25 hover:text-[#1C1C1A]/50")}
              >
                {node.type}
                <Pencil size={7} className="opacity-0 group-hover:opacity-60" />
              </button>
            )}

            {editing ? (
              <input
                ref={inputRef}
                autoFocus
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") commitName(); }}
                onClick={e => e.stopPropagation()}
                className={cn("w-full bg-transparent border-none outline-none font-serif", isRoot ? "text-base text-white" : "text-sm text-[#1C1C1A]")}
              />
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className={cn("font-serif truncate block w-full text-left transition-opacity leading-tight", isRoot ? "text-base hover:text-white/80" : "text-sm hover:opacity-60")}
              >
                {node.name}
              </button>
            )}
          </div>

          {node.level === 1 && (
              <div className="flex items-center gap-2 bg-[#1C1C1A]/5 px-3 py-1.5 rounded-xl border border-black/5 group-hover:border-brand-green/20 transition-all">
                   <input 
                      type="number" 
                      value={node.durationYears || 4} 
                      min={1} max={10}
                      onChange={(e) => { e.stopPropagation(); onDurationChange(node.id, parseInt(e.target.value) || 1); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 bg-transparent border-none outline-none text-[11px] font-black text-center text-brand-green"
                   />
                   <span className="text-[8px] font-black uppercase tracking-widest text-[#1C1C1A]/30">Yrs</span>
              </div>
          )}

          {hasChildren && (
            <div className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black font-sans shrink-0", theme.badge)}>
              {children.length}
            </div>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onAdd(node.id); }}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm",
                isRoot ? "bg-white/25 text-white hover:bg-white/40" : "bg-[#3D8528]/10 text-[#3D8528] hover:bg-[#3D8528] hover:text-white"
              )}
              title="Add child"
            >
              <Plus size={14} />
            </motion.button>
            {!isRoot && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onRemove(node.id); }}
                className="w-7 h-7 rounded-full bg-red-500/5 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                title="Remove"
              >
                <X size={14} />
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence initial={false}>
        {!node.collapsed && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className={cn("relative", isRoot ? "ml-6 mt-2" : "ml-8 mt-1")}>
              {!isRoot && (
                <div className={cn("absolute left-3 top-0 bottom-0 w-0.5 rounded-full pointer-events-none", getTheme(node.level + 1).line)} />
              )}

              <div className="space-y-1.5">
                {children.map((child, idx) => (
                  <TreeNodeItem
                    key={child.localKey}
                    node={child}
                    allNodes={allNodes}
                    isLast={idx === children.length - 1}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onRename={onRename}
                    onDurationChange={onDurationChange}
                    onTypeChange={onTypeChange}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// MAIN EXPORT
export function HierarchyFlow({ nodes, onNodesChange }: HierarchyFlowProps) {
  const root = nodes.find(n => n.parentId === null);

  const addChild = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const siblings = nodes.filter(n => n.parentId === parentId);
    const newLevel = parent.level + 1;
    const defaultTypes: Record<number, string> = {
      1: "Course (B.tech/M.tech etc)",
      2: "School",
      3: "Branch",
      4: "Unit",
    };

    const initialId = crypto.randomUUID(); // Full UUID for safety as primary key
    const newNode: OrgNode = {
      id: initialId,
      localKey: initialId,
      parentId,
      name: "New Entity",
      type: defaultTypes[newLevel] || `Level ${newLevel}`,
      level: newLevel,
      collapsed: false,
      order: siblings.length,
    };

    const updated = nodes.map(n => n.id === parentId ? { ...n, collapsed: false } : n);
    onNodesChange([...updated, newNode]);
  };

  const removeNode = (id: string) => {
    const toRemove = new Set<string>([id]);
    const cascade = (pid: string) => {
      nodes.filter(n => n.parentId === pid).forEach(c => { toRemove.add(c.id); cascade(c.id); });
    };
    cascade(id);
    onNodesChange(nodes.filter(n => !toRemove.has(n.id)));
  };

  const renameNode = (id: string, name: string) => {
    onNodesChange(nodes.map(n => n.id === id ? { ...n, name } : n));
  };

  const changeDuration = (id: string, durationYears: number) => {
    onNodesChange(nodes.map(n => n.id === id ? { ...n, durationYears } : n));
  };

  const changeType = (id: string, type: string) => {
    onNodesChange(nodes.map(n => n.id === id ? { ...n, type } : n));
  };

  const toggleCollapse = (id: string) => {
    onNodesChange(nodes.map(n => n.id === id ? { ...n, collapsed: !n.collapsed } : n));
  };

  if (!root) return null;

  const totalNodes = nodes.length;
  const maxDepth = Math.max(...nodes.map(n => n.level)) + 1;

  return (
    <div className="w-full relative">
      {/* The Tree */}
      <div className="space-y-2 p-6">
        <TreeNodeItem
          node={root}
          allNodes={nodes}
          isLast={true}
          onAdd={addChild}
          onRemove={removeNode}
          onRename={renameNode}
          onDurationChange={changeDuration}
          onTypeChange={changeType}
          onToggle={toggleCollapse}
        />
      </div>

      {/* Status Footer */}
      <div className="sticky bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-[#F4F2EB] via-[#F4F2EB]/95 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/20 font-sans">
              {totalNodes} nodes
            </span>
            <div className="w-px h-3 bg-[#1C1C1A]/10" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/20 font-sans">
              {maxDepth} levels deep
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/15 font-sans">
            Click + to add · Click name to edit
          </span>
        </div>
      </div>
    </div>
  );
}
