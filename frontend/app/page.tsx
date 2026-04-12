import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { BranchingTree } from "@/components/sections/BranchingTree";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PerformanceStories } from "@/components/sections/PerformanceStories";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F4F2EB] selection:bg-[#84A942] selection:text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <BranchingTree />
      <Features />
      <HowItWorks />
      <PerformanceStories />
      <CTA />
      <Footer />

    </main>
  );
}