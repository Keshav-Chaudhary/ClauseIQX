"use client";

import { useState } from "react";
import { UploadCloud, SearchCheck, AlertOctagon, FileSpreadsheet, Check } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Badge } from "@/components/ui/Badge";

const STEPS = [
  {
    step: "01",
    title: "Upload & OCR Ingestion",
    icon: UploadCloud,
    tag: "Multi-Format",
    description:
      "Drag and drop PDFs, DOCX, or scanned legal instruments. Our multi-engine OCR preserves table boundaries, numbering schemas, and structural hierarchies.",
    details: [
      "Staged upload with checksum validation",
      "Client-side encrypted payload transport",
      "Automatic page and paragraph anchor generation",
    ],
  },
  {
    step: "02",
    title: "Semantic Clause Grounding",
    icon: SearchCheck,
    tag: "High Precision",
    description:
      "Advanced LLM pipeline segments the contract into legal units. Every extracted provision is strictly tied to an unalterable bounding box in the original document.",
    details: [
      "Zero-hallucination citation verification",
      "Standard taxonomy mapping across 50+ clause types",
      "Governing law and jurisdiction detection",
    ],
  },
  {
    step: "03",
    title: "Deviation & Risk Scoring",
    icon: AlertOctagon,
    tag: "Actionable",
    description:
      "Identifies non-standard language, uncapped indemnities, one-sided termination rights, and ambiguous renewal provisions with clear severity rankings.",
    details: [
      "Categorized by High, Medium, and Informational severity",
      "Plain-language risk explanation for non-lawyers",
      "Recommended review points to verify with counsel",
    ],
  },
  {
    step: "04",
    title: "Counsel Brief & Export",
    icon: FileSpreadsheet,
    tag: "Cost-Saving",
    description:
      "Generate an executive briefing package ready for your attorney or executive team. Download markdown, audit trails, and structured question sheets.",
    details: [
      "One-click consultation brief compilation",
      "Targeted questions prepared for counsel review",
      "Full JSON export for compliance and archival",
    ],
  },
];

export function AnalysisJourneySection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="border-t border-b border-[var(--border)] bg-surface-2/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Workflow Architecture
          </div>
          <h2 className="text-3xl font-black tracking-tight text-fg sm:text-5xl">
            From raw document to legal clarity in 4 steps.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-fg-muted">
            Explore how ClauseIQX processes agreements with transparent, grounded steps.
          </p>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Step Selector Buttons (Left Column) */}
          <div className="lg:col-span-5 space-y-3">
            {STEPS.map((s, idx) => {
              const isCurrent = activeStep === idx;
              const Icon = s.icon;
              return (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    isCurrent
                      ? "bg-surface border-[var(--accent)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-[var(--accent)]/40"
                      : "bg-surface-2 border-[var(--border-strong)] hover:border-border hover:bg-surface-3"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center transition-colors ${
                        isCurrent
                          ? "bg-accent text-white"
                          : "bg-surface-3 text-fg-muted"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-fg-subtle uppercase tracking-wider">
                        Step {s.step}
                      </div>
                      <div className="text-base font-bold text-fg mt-0.5">
                        {s.title}
                      </div>
                    </div>
                  </div>
                  <Badge tone={isCurrent ? "accent" : "neutral"} className="text-[10px]">
                    {s.tag}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Active Step Showcase Card (Right Column) */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl border border-[var(--border-strong)] bg-surface shadow-[var(--shadow-md)] relative overflow-hidden">
              <div className="absolute top-0 right-0 size-64 bg-accent-subtle rounded-full blur-[90px] pointer-events-none -z-10" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-accent">
                    {STEPS[activeStep].step}
                  </span>
                  <span className="text-sm font-bold text-fg-muted uppercase tracking-widest">
                    / Phase Definition
                  </span>
                </div>
                <Badge tone="accent" className="text-xs uppercase font-bold tracking-wider">
                  {STEPS[activeStep].tag}
                </Badge>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-fg mb-4">
                {STEPS[activeStep].title}
              </h3>

              <p className="text-base text-fg-muted leading-relaxed mb-8">
                {STEPS[activeStep].description}
              </p>

              <div className="space-y-3 pt-6 border-t border-border">
                <div className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                  Key Capabilities Delivered:
                </div>
                {STEPS[activeStep].details.map((detail) => (
                  <div key={detail} className="flex items-center gap-3 text-sm text-fg">
                    <div className="size-5 rounded-full bg-positive-subtle text-positive flex items-center justify-center shrink-0">
                      <Check className="size-3" />
                    </div>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
