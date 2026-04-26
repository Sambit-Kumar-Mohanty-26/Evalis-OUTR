"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Download, Printer, Copy, Check, GraduationCap, Users, UserCog, Building2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const roles = [
    { 
        id: "HEAD_OF_SCHOOL", 
        name: "Head of Schools", 
        icon: Building2, 
        color: "bg-purple-600",
        lightColor: "bg-purple-50"
    },
    { 
        id: "ADVISOR", 
        name: "Academic Advisors", 
        icon: UserCog, 
        color: "bg-blue-600",
        lightColor: "bg-blue-50"
    },
    { 
        id: "TEACHER", 
        name: "Faculty Members", 
        icon: Users, 
        color: "bg-emerald-600",
        lightColor: "bg-emerald-50"
    },
    { 
        id: "STUDENT", 
        name: "Students", 
        icon: GraduationCap, 
        color: "bg-orange-600",
        lightColor: "bg-orange-50"
    }
];

export default function QrOnboardingPage() {
    const { user } = useAuth();
    const [origin, setOrigin] = useState("");
    const [copiedRoleId, setCopiedRoleId] = useState<string | null>(null);

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const copyToClipboard = (roleId: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedRoleId(roleId);
        toast.success(`${roleId.replace(/_/g, " ")} join link copied!`);
        setTimeout(() => setCopiedRoleId(null), 2000);
    };

    const handleBulkExport = () => {
        const rows = [
            ["Role", "Join Link"],
            ...roles.map(r => [r.name, `${origin}/join/${r.id.toLowerCase()}?tenantId=${user?.tenantId}`])
        ];
        const csvContent = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `evalis_onboarding_links_${user?.tenantName?.replace(/\s+/g, '_')}.csv`);
        link.click();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 print:p-0 print:m-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1C1C1A]/5 border border-[#1C1C1A]/10 text-[#1C1C1A]/60">
                        <QrCode size={12} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">{user?.tenantName || "Institutional"} Registration</span>
                    </div>
                    <h1 className="text-3xl font-serif text-[#1C1C1A]">Access Portal</h1>
                    <p className="text-xs text-[#1C1C1A]/40 font-medium max-w-sm leading-relaxed">
                        Deploy these unique codes to onboard staff and students to your institutional grid.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#1C1C1A]/5 text-xs font-bold text-[#1C1C1A]/60 hover:bg-[#F8F7F2] transition-all"
                    >
                        <Printer size={16} />
                        Print PDF
                    </button>
                    <button 
                        onClick={handleBulkExport}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1C1A] text-white text-xs font-bold shadow-lg shadow-[#1C1C1A]/10 hover:shadow-xl transition-all"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block text-center mb-10 p-6 border-b border-black">
                <h1 className="text-3xl font-bold mb-1">{user?.tenantName}</h1>
                <p className="text-lg opacity-60 italic font-serif">Onboarding Access Grid</p>
            </div>

            {/* QR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-10">
                {roles.map((role, idx) => {
                    const joinUrl = `${origin}/join/${role.id.toLowerCase()}?tenantId=${user?.tenantId}`;
                    
                    return (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative flex flex-col bg-white rounded-[32px] p-5 border border-[#1C1C1A]/5 shadow-sm hover:shadow-xl transition-all duration-300 print:shadow-none print:border-black/5 print:break-inside-avoid"
                        >
                            {/* Card Header - Compact */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", role.color)}>
                                    <role.icon size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xs font-black text-[#1C1C1A] uppercase tracking-wider">{role.name}</h3>
                                    <span className="text-[8px] text-[#1C1C1A]/20 font-bold uppercase tracking-widest leading-none">Portal Access</span>
                                </div>
                            </div>

                            {/* QR Canvas - Compact with softer background */}
                            <div className="relative aspect-square w-full bg-[#F8F7F2]/50 rounded-[24px] p-6 mb-5 flex items-center justify-center border border-[#1C1C1A]/[0.02] print:bg-white print:border-black/5">
                                {origin && (
                                    <QRCodeSVG 
                                        value={joinUrl}
                                        size={256}
                                        level="H"
                                        includeMargin={false}
                                        className="w-full h-full opacity-90"
                                    />
                                )}
                            </div>

                            {/* Action Area - Subtle and integrated */}
                            <div className="space-y-3 print:hidden">
                                <button 
                                    onClick={() => copyToClipboard(role.id, joinUrl)}
                                    className={cn(
                                        "w-full py-3.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2.5 transition-all duration-300",
                                        copiedRoleId === role.id 
                                            ? "bg-brand-green/10 text-brand-green" 
                                            : "bg-[#1C1C1A]/5 text-[#1C1C1A]/40 hover:bg-[#1C1C1A] hover:text-white"
                                    )}
                                >
                                    {copiedRoleId === role.id ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedRoleId === role.id ? "Link Copied" : "Copy Access Link"}
                                </button>
                                <div className="flex items-center justify-center gap-2 opacity-10">
                                    <div className="h-[1px] w-4 bg-[#1C1C1A]" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Institutional Grid</span>
                                    <div className="h-[1px] w-4 bg-[#1C1C1A]" />
                                </div>
                            </div>

                            {/* Print Only Footer */}
                            <div className="hidden print:block text-center mt-3">
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{role.name} Access</p>
                                <p className="text-[7px] mt-0.5 font-mono opacity-20 truncate">{joinUrl}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Minimal Footer */}
            <div className="pt-6 border-t border-[#1C1C1A]/5 flex items-center justify-center print:hidden">
                <p className="text-[9px] text-[#1C1C1A]/15 font-black uppercase tracking-[0.2em]">
                    Evalis Institutional Protocol v2.1
                </p>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 1.5cm; }
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
