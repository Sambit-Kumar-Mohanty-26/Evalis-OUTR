import Link from "next/link";
import { SketchyLink } from "../ui/SketchyLink";
import { Button } from "../ui/Button";
import { User } from "lucide-react";
import { EvalisLogo } from "../ui/EvalisLogo";

export function Navbar() {
    return (
        <header className="w-full py-6 px-8 md:px-16 flex items-center justify-between sticky top-0 z-50 bg-[#F4F2EB]/90 backdrop-blur-md border-b border-black/5">

            <div className="flex-shrink-0 mt-2">
                <EvalisLogo />
            </div>
            <nav className="hidden lg:flex items-center gap-8 xl:gap-12">
                <SketchyLink href="#about">Journeys</SketchyLink>
                <SketchyLink href="#analytics">Analytics</SketchyLink>
                <SketchyLink href="#how-it-works">Workflow</SketchyLink>
                <SketchyLink href="#stories">Insights</SketchyLink>
            </nav>
            <div className="flex items-center gap-4">
                <Link
                    href="/login"
                    className="hidden md:flex items-center gap-2 font-sans text-sm font-medium text-[#1C1C1A] hover:text-[#679267] transition-colors"
                >
                    <User size={18} />
                    Sign In
                </Link>
                <Link href="/onboard">
                    <Button className="px-6 py-2.5 text-sm md:text-base bg-[#3D8528] hover:bg-[#2F6A1E] text-white">
                        Get Started
                    </Button>
                </Link>
            </div>
        </header>
    );
}