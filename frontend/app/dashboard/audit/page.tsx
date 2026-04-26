"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Activity, 
    Search, 
    Filter, 
    User, 
    Database, 
    ShieldAlert, 
    Clock,
    ChevronLeft,
    ChevronRight,
    LogIn,
    PlusCircle,
    Edit,
    Trash2,
    Calendar,
    Hash
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface AuditLog {
    id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
    entity: string;
    entityId: string;
    metadata: any;
    timestamp: string;
    ipAddress?: string;
    user: {
        fullName: string;
        email: string;
        role: string;
    };
}

export default function AuditLogsPage() {
    const { user: currentUser } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                search,
                action: actionFilter,
                entity: entityFilter
            });
            const response = await api.get(`/api/v1/admin/audit-logs?${params}`);
            setLogs(response.data.logs);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityFilter]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'LOGIN': return <LogIn size={16} className="text-blue-500" />;
            case 'CREATE': return <PlusCircle size={16} className="text-green-500" />;
            case 'UPDATE': return <Edit size={16} className="text-amber-500" />;
            case 'DELETE': return <Trash2 size={16} className="text-red-500" />;
            default: return <Activity size={16} className="text-gray-500" />;
        }
    };

    const getEntityIcon = (entity: string) => {
        switch (entity) {
            case 'User': return <User size={14} />;
            case 'School': return <Database size={14} />;
            default: return <Hash size={14} />;
        }
    };

    const formatMetadata = (log: AuditLog) => {
        if (log.action === 'LOGIN') {
            return `Logged into the system from IP ${log.ipAddress || 'unknown'}`;
        }
        
        if (log.action === 'CREATE' && log.entity === 'User') {
            const data = log.metadata;
            if (data?.action === 'BULK_UPLOAD') {
                return `Bulk uploaded ${data.created} students successfully.`;
            }
            return `Added new user: ${data?.fullName || log.entityId} (${data?.role || 'STUDENT'})`;
        }

        if (log.action === 'UPDATE' && log.entity === 'User') {
            const data = log.metadata;
            if (data?.action === 'PASSWORD_RESET') {
                return `Reset password for user ID ${log.entityId}`;
            }
            return `Updated profile for ${log.entity}: ${log.entityId}`;
        }

        return `${log.action.toLowerCase()}d ${log.entity} (${log.entityId})`;
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">Audit Logs</h1>
                    <p className="text-[#1C1C1A]/40 text-lg font-light">
                        Chronological record of system-wide administrative actions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-2xl border border-[#1C1C1A]/5 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-brand-green" />
                        <span className="text-xs font-bold text-[#1C1C1A]/60">{total} Actions Logged</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by name, entity, or ID..."
                        className="w-full h-12 pl-12 pr-4 bg-white rounded-2xl border border-[#1C1C1A]/5 focus:outline-none focus:ring-2 focus:ring-brand-green/20 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                    />
                </div>

                <select 
                    className="h-12 px-4 bg-white rounded-2xl border border-[#1C1C1A]/5 focus:outline-none text-sm font-medium"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                >
                    <option value="all">All Actions</option>
                    <option value="CREATE">Creation</option>
                    <option value="UPDATE">Updates</option>
                    <option value="DELETE">Deletions</option>
                    <option value="LOGIN">Logins</option>
                </select>

                <select 
                    className="h-12 px-4 bg-white rounded-2xl border border-[#1C1C1A]/5 focus:outline-none text-sm font-medium"
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                >
                    <option value="all">All Entities</option>
                    <option value="User">Users</option>
                    <option value="School">Schools</option>
                    <option value="Subject">Subjects</option>
                    <option value="Batch">Batches</option>
                </select>
            </div>

            {/* Logs Timeline */}
            <div className="space-y-4">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : logs.length > 0 ? (
                    <div className="bg-white rounded-[32px] border border-[#1C1C1A]/5 overflow-hidden">
                        <div className="divide-y divide-[#1C1C1A]/5">
                            {logs.map((log, i) => (
                                <motion.div 
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-6 hover:bg-[#FDFDFC] transition-colors group"
                                >
                                    <div className="flex items-start gap-6">
                                        {/* Action Icon */}
                                        <div className="mt-1 w-10 h-10 rounded-2xl bg-white border border-[#1C1C1A]/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            {getActionIcon(log.action)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-[#1C1C1A]">{log.user.fullName}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C1C1A]/5 text-[#1C1C1A]/40 font-black uppercase tracking-widest">{log.user.role.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-[#1C1C1A]/30 font-medium">
                                                    <Clock size={12} />
                                                    {format(new Date(log.timestamp), "MMM dd, yyyy • hh:mm a")}
                                                </div>
                                            </div>

                                            <p className="text-[15px] text-[#1C1C1A]/70 leading-relaxed font-medium">
                                                {formatMetadata(log)}
                                            </p>

                                            <div className="flex items-center gap-4 pt-2">
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-green/5 text-brand-green text-[10px] font-bold">
                                                    {getEntityIcon(log.entity)}
                                                    {log.entity}
                                                </div>
                                                <div className="text-[10px] text-[#1C1C1A]/30 font-mono">
                                                    ID: {log.entityId}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-64 bg-white rounded-[32px] border border-[#1C1C1A]/5 border-dashed flex flex-col items-center justify-center text-center p-12">
                        <Activity size={48} className="text-[#1C1C1A]/10 mb-4" />
                        <h3 className="text-xl font-serif text-[#1C1C1A]">No records found</h3>
                        <p className="text-sm text-[#1C1C1A]/40 max-w-xs">Adjust your filters or search terms to find specific activity records.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && total > 20 && (
                <div className="flex items-center justify-center gap-4">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-3 rounded-2xl bg-white border border-[#1C1C1A]/5 disabled:opacity-30 hover:bg-[#1C1C1A] hover:text-white transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-[#1C1C1A]/60">
                        Page {page} of {Math.ceil(total / 20)}
                    </span>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(total / 20)}
                        className="p-3 rounded-2xl bg-white border border-[#1C1C1A]/5 disabled:opacity-30 hover:bg-[#1C1C1A] hover:text-white transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
