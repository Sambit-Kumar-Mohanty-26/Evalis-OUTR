"use client";

import { MarksEntryPanel } from "@/components/shared/MarksEntryPanel";
import { PenLine } from "lucide-react";

export default function AdvisorMarks() {
    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Marks Entry</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Manage and update student marks for your branch</p>
            </div>

            <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 p-2 shadow-sm">
                <MarksEntryPanel />
            </div>
        </div>
    );
}
