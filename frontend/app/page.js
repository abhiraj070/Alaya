import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import WorkflowSection from "@/components/landing/WorkflowSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FaqSection from "@/components/landing/FaqSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col selection:bg-accent-sky/25 selection:text-text-primary">
      {/* 1. Global Navigation Bar */}
      <Navbar />

      {/* 2. Main Content Flow */}
      <main className="flex-1">
        {/* Hero: Conversational Focus with Knowledge Base + Chat Demo */}
        <Hero />

        {/* How It Works: 4 Simple User Journey Stages + Interactive Chat Preview */}
        <WorkflowSection />

        {/* Features: Document Upload, Extraction, Conversational Retrieval, Natural Language */}
        <FeaturesSection />

        {/* FAQ: Common questions about ingestion, retrieval, citations, and privacy */}
        <FaqSection />

        {/* Final CTA: "Your knowledge is already there. Start a conversation." */}
        <FinalCtaSection />
      </main>

      {/* 3. Global Footer */}
      <Footer />
    </div>
  );
}
