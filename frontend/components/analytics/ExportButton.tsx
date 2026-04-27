"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Table } from "lucide-react";
import Papa from "papaparse";

interface ExportButtonProps {
    data: any[];
    filename?: string;
    title?: string;
}

export function ExportButton({ data, filename = "analytics-export", title = "Analytics Report" }: ExportButtonProps) {
    const [open, setOpen] = useState(false);

    const exportCSV = () => {
        if (!data.length) return;
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
    };

    const exportPDF = () => {
        // Use print-optimized view
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const headers = Object.keys(data[0] || {});
        const rows = data.map(row => headers.map(h => row[h] ?? ""));

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; padding: 40px; color: #1C1C1A; }
                    h1 { font-size: 24px; margin-bottom: 8px; }
                    .subtitle { font-size: 12px; color: #1C1C1A80; margin-bottom: 24px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th { text-align: left; padding: 8px 12px; background: #F4F2EB; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 10px; color: #1C1C1A80; }
                    td { padding: 8px 12px; border-bottom: 1px solid #1C1C1A10; }
                    tr:hover td { background: #F4F2EB40; }
                    .footer { margin-top: 32px; font-size: 10px; color: #1C1C1A40; text-align: center; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Evalis Analytics</p>
                <table>
                    <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
                    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
                </table>
                <p class="footer">Evalis Institutional Intelligence · Analytics Export</p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#1C1C1A]/40 hover:text-[#1C1C1A]/60 hover:bg-white/60 border border-transparent hover:border-[#1C1C1A]/5 transition-all"
            >
                <Download size={13} />
                Export
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            className="absolute top-full right-0 mt-2 z-40 bg-white/95 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl shadow-xl overflow-hidden min-w-[160px]"
                        >
                            <button
                                onClick={exportCSV}
                                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-[#1C1C1A]/60 hover:bg-[#F4F2EB] transition-colors"
                            >
                                <Table size={14} />
                                Export as CSV
                            </button>
                            <button
                                onClick={exportPDF}
                                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-[#1C1C1A]/60 hover:bg-[#F4F2EB] transition-colors border-t border-[#1C1C1A]/5"
                            >
                                <FileText size={14} />
                                Export as PDF
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
