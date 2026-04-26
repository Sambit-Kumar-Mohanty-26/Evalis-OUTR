"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
    X, Upload, FileSpreadsheet, Loader2, AlertTriangle,
    CheckCircle2, XCircle, ChevronDown, Download, Eye
} from "lucide-react";

interface BulkUploadModalProps {
    activeTab: "teachers" | "students" | "admin";
    metadata: {
        orgNodes: { id: string; name: string; type: string; level: number; parentId: string | null }[];
        programs: { id: string; name: string }[];
        schools: { id: string; name: string; programId: string }[];
        branches: { id: string; name: string; schoolId: string }[];
        batches: { id: string; name: string; branchId: string }[];
        subjects: { id: string; name: string; code: string }[];
    };
    onClose: () => void;
    onSuccess: () => void;
}

interface UploadResult {
    message: string;
    created: number;
    total: number;
    failed: number;
    errors: string[];
}

type Step = "upload" | "preview" | "result";

export default function BulkUploadModal({ activeTab, metadata, onClose, onSuccess }: BulkUploadModalProps) {
    const isStudent = activeTab === "students";
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<UploadResult | null>(null);

    // Context selections for batch assignment
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");

    const filteredBatches = selectedBranch
        ? metadata.batches.filter(b => b.branchId === selectedBranch)
        : metadata.batches;

    // ─── File Handling ───────────────────────────────────────────────────────
    const handleFileSelect = useCallback((selectedFile: File) => {
        setError("");
        if (!selectedFile.name.endsWith(".csv")) {
            setError("Only CSV files are accepted.");
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError("File size must be under 10MB.");
            return;
        }

        setFile(selectedFile);

        // Parse preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split("\n").filter(l => l.trim());
            if (lines.length < 2) {
                setError("CSV must have a header row and at least one data row.");
                return;
            }

            const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
            const rows = lines.slice(1, 11).map(line => {
                const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
                const row: Record<string, string> = {};
                headers.forEach((h, i) => { row[h] = values[i] || ""; });
                return row;
            });

            setPreviewData(rows);
            setStep("preview");
        };
        reader.readAsText(selectedFile);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileSelect(droppedFile);
    }, [handleFileSelect]);

    // ─── Upload ──────────────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("role", isStudent ? "STUDENT" : "TEACHER");
            if (isStudent && selectedBatch) {
                // Legacy support if UI is bypassed
            }

            const data = await api.upload<UploadResult>("/api/v1/user/bulk", formData);
            setResult(data);
            setStep("result");
        } catch (err: any) {
            setError(err.message || "Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    // ─── CSV Template Download ───────────────────────────────────────────────
    const downloadTemplate = () => {
        const headers = isStudent
            ? "fullName,email,phoneNumber,rollNumber,program,school,branch,batch,semester"
            : "fullName,email,phoneNumber,school,department";
        const exampleRow = isStudent
            ? "John Doe,john@edu.in,9876543210,2024BTCS001,B.Tech,School of Computer Sciences,CSE,2024 Batch,1"
            : "Jane Smith,jane@edu.in,9876543210,School of Arts,\"English,History\"";

        const csvContent = `${headers}\n${exampleRow}`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `evalis_${isStudent ? "students" : "teachers"}_template.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
            <div className="absolute inset-0 bg-[#1C1C1A]/40 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-3xl bg-[#F8F7F2] rounded-[32px] border border-[#1C1C1A]/10 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-[#1C1C1A]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-[#1C1C1A]">
                                Bulk Upload — {isStudent ? "Students" : "Teachers"}
                            </h2>
                            <p className="text-xs text-[#1C1C1A]/30">
                                {step === "upload" && "Upload CSV file"}
                                {step === "preview" && `Preview • ${previewData.length} rows shown`}
                                {step === "result" && "Upload complete"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Step Indicators */}
                        {["upload", "preview", "result"].map((s, i) => (
                            <div
                                key={s}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    step === s ? "bg-brand-green w-6" : "bg-[#1C1C1A]/10"
                                }`}
                            />
                        ))}
                        <button onClick={onClose} className="ml-4 w-10 h-10 rounded-2xl bg-white/60 flex items-center justify-center text-[#1C1C1A]/30 hover:text-[#1C1C1A] hover:bg-white transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 mb-6"
                        >
                            <AlertTriangle size={16} />
                            {error}
                        </motion.div>
                    )}

                    {/* ── Step 1: Upload ───────────────────────────────────── */}
                    {step === "upload" && (
                        <div className="space-y-6">
                            {/* Context Selection for Students */}
                            {/* We no longer show batch dropdowns; context is extracted strictly from the parsed CSV for organizational alignment. */}

                            {/* Dropzone */}
                            <div
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="relative flex flex-col items-center justify-center py-16 border-2 border-dashed border-[#1C1C1A]/10 rounded-[28px] bg-white/20 hover:bg-white/40 hover:border-brand-green/20 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 rounded-[20px] bg-brand-green/10 flex items-center justify-center text-brand-green mb-5 group-hover:scale-110 transition-transform">
                                    <Upload size={28} />
                                </div>
                                <p className="text-sm font-semibold text-[#1C1C1A]/60 mb-1">
                                    Drag & drop your CSV file here
                                </p>
                                <p className="text-xs text-[#1C1C1A]/25">
                                    or click to browse • Max 10MB
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={e => {
                                        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                                    }}
                                />
                            </div>

                            {/* Template Download */}
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline mx-auto"
                            >
                                <Download size={14} />
                                Download CSV Template
                            </button>

                            {/* Format Info */}
                            <div className="p-5 bg-white/40 rounded-[24px] border border-[#1C1C1A]/5">
                                <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#1C1C1A]/30 mb-3 block">
                                    Expected CSV Format
                                </span>
                                <div className="font-mono text-xs text-[#1C1C1A]/40 bg-[#1C1C1A]/[0.03] rounded-xl p-4 overflow-x-auto">
                                    {isStudent
                                        ? "fullName, email, phoneNumber, rollNumber, program, school, branch, batch, semester"
                                        : "fullName, email, phoneNumber, school, department"
                                    }
                                    {!isStudent && (
                                        <p className="mt-2 text-[10px] text-[#1C1C1A]/20 leading-relaxed">
                                            * Note: department can be comma-separated for multiple departments (e.g., "Physics,Chemistry").
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Preview ──────────────────────────────────── */}
                    {step === "preview" && (
                        <div className="space-y-6">
                            {/* File Info */}
                            <div className="flex items-center gap-4 p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                                <FileSpreadsheet size={20} className="text-brand-green" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#1C1C1A]">{file?.name}</p>
                                    <p className="text-[10px] text-[#1C1C1A]/30">
                                        {(file?.size ? file.size / 1024 : 0).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setPreviewData([]); setStep("upload"); }}
                                    className="text-xs font-bold text-red-400 hover:text-red-600"
                                >
                                    Remove
                                </button>
                            </div>

                            {/* Preview Table */}
                            <div className="overflow-x-auto rounded-2xl border border-[#1C1C1A]/5">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#1C1C1A]/[0.03]">
                                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-[#1C1C1A]/30">#</th>
                                            {previewData.length > 0 && Object.keys(previewData[0]).map(key => (
                                                <th key={key} className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-[#1C1C1A]/30">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row, i) => (
                                            <tr key={i} className="border-t border-[#1C1C1A]/[0.03]">
                                                <td className="px-4 py-3 text-xs text-[#1C1C1A]/20 font-mono">{i + 1}</td>
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className="px-4 py-3 text-sm text-[#1C1C1A]/60">
                                                        {val || <span className="text-[#1C1C1A]/15">—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-[#1C1C1A]/20 text-center">
                                Showing first {previewData.length} rows • Validation runs on confirm
                            </p>
                        </div>
                    )}

                    {/* ── Step 3: Result ───────────────────────────────────── */}
                    {step === "result" && result && (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className={`p-8 rounded-[28px] text-center ${
                                result.failed === 0
                                    ? "bg-emerald-50 border border-emerald-100"
                                    : "bg-amber-50 border border-amber-100"
                            }`}>
                                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                                    result.failed === 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                }`}>
                                    {result.failed === 0 ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                                </div>
                                <h3 className="text-2xl font-serif text-[#1C1C1A] mb-2">{result.message}</h3>
                                <div className="flex justify-center gap-8 mt-6">
                                    <div className="text-center">
                                        <span className="text-3xl font-bold text-emerald-600">{result.created}</span>
                                        <p className="text-[10px] text-[#1C1C1A]/30 mt-1 uppercase tracking-widest">Created</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-3xl font-bold text-red-400">{result.failed}</span>
                                        <p className="text-[10px] text-[#1C1C1A]/30 mt-1 uppercase tracking-widest">Failed</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-3xl font-bold text-[#1C1C1A]/40">{result.total}</span>
                                        <p className="text-[10px] text-[#1C1C1A]/30 mt-1 uppercase tracking-widest">Total</p>
                                    </div>
                                </div>
                            </div>

                            {/* Error Log */}
                            {result.errors.length > 0 && (
                                <div className="p-5 bg-red-50/50 rounded-[24px] border border-red-100">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-red-400 mb-3">
                                        Validation Errors ({result.errors.length})
                                    </p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {result.errors.map((err, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-red-600/70">
                                                <XCircle size={12} className="mt-0.5 shrink-0" />
                                                {err}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-[#1C1C1A]/5 flex items-center justify-between bg-white/20">
                    <p className="text-[10px] text-[#1C1C1A]/20">
                        Default password for all: <span className="font-mono">Evalis@2026</span>
                    </p>
                    <div className="flex items-center gap-3">
                        {step === "preview" && (
                            <button
                                onClick={() => { setFile(null); setPreviewData([]); setStep("upload"); }}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#1C1C1A]/40 hover:text-[#1C1C1A] transition-colors"
                            >
                                Back
                            </button>
                        )}
                        {step === "result" && (
                            <button
                                onClick={onSuccess}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1C1C1A] text-white text-sm font-semibold hover:bg-[#2a2a28] shadow-lg shadow-[#1C1C1A]/10 transition-all"
                            >
                                <CheckCircle2 size={16} />
                                Done
                            </button>
                        )}
                        {step === "preview" && (
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1C1C1A] text-white text-sm font-semibold hover:bg-[#2a2a28] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#1C1C1A]/10 transition-all"
                            >
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                {isUploading ? "Processing..." : "Confirm & Upload"}
                            </button>
                        )}
                        {step === "upload" && (
                            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#1C1C1A]/40 hover:text-[#1C1C1A] transition-colors">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
