"use client";

import { useState, useEffect, useRef } from "react";
import WorkflowStages from "./WorkflowStages";
import WorkflowDemo from "./WorkflowDemo";

export default function WorkflowSection() {
  const [activeStage, setActiveStage] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  // Scroll-triggered viewport activation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Run once cleanly
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative scroll-mt-20 py-20 md:py-28 overflow-hidden bg-bg-primary"
    >
      {/* Subtle Background Accent Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[140px]"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Subtitle */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-secondary px-3 py-1 text-xs font-semibold tracking-wider text-accent-sky uppercase">
            <span>WORKFLOW & RETRIEVAL ENGINE</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl leading-[1.15]">
            A simple process. <br />
            <span className="text-accent-sky drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              Powerful results.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Upload your documents or write down what you want to remember. Alaya builds
            a unified knowledge base you can question anytime.
          </p>
        </div>

        {/* Four Connected Workflow Stages */}
        <div className="mt-14">
          <WorkflowStages
            activeStage={activeStage}
            onSelectStage={setActiveStage}
            isVisible={isVisible}
          />
        </div>

        {/* Interactive How It Works Demonstration */}
        <div className="mt-6">
          <WorkflowDemo
            activeStage={activeStage}
            onSelectStage={setActiveStage}
          />
        </div>
      </div>
    </section>
  );
}
