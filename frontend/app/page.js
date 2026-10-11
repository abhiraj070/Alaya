import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import WorkflowSection from "@/components/landing/WorkflowSection";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col selection:bg-accent-sky/25 selection:text-text-primary">
      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* 2. Main Content Flow */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Anchor placeholder for Features (Phase 2.3) */}
        <div id="features" className="scroll-mt-20" aria-hidden="true" />

        {/* Phase 2.2: Workflow "From Files to Knowledge" Section */}
        <WorkflowSection />

        {/* Anchor placeholder for FAQ (Future Phase) */}
        <div id="faq" className="scroll-mt-20" aria-hidden="true" />
      </main>
    </div>
  );
}
