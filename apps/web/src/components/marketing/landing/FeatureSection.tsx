import { Sparkles, GitCompare, Calendar, FileCheck, BookOpen } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function FeatureSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 overflow-hidden">
      <ScrollReveal animation="custom-fade-in" className="mb-16 text-center max-w-3xl mx-auto">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
          Architecture & Capabilities
        </div>
        <h2 className="text-3xl font-black tracking-tight text-fg sm:text-5xl">
          Engineered for precise legal comprehension.
        </h2>
        <p className="mt-6 text-lg sm:text-xl text-fg-muted leading-relaxed">
          Replace tedious manual line-by-line reading with structured, evidence-backed intelligence. Every clause is verified, indexed, and cross-referenced with your corporate standards.
        </p>
      </ScrollReveal>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Feature 1 - Large Span 2 */}
        <ScrollReveal
          delayMs={100}
          className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] md:col-span-2 transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)]"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent-subtle)] blur-[80px] transition-all group-hover:scale-150" />
          <span className="relative flex size-14 items-center justify-center rounded-2xl bg-surface-3 border border-[var(--border)] text-[var(--accent)] mb-8">
            <Sparkles className="size-7" />
          </span>
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Pillar 1</div>
          <h3 className="relative text-2xl font-bold text-fg">Semantic Clause Classification</h3>
          <p className="relative mt-4 max-w-lg text-base sm:text-lg text-fg-muted leading-relaxed">
            Automatically decomposes dense contracts into standardized clause categories: Indemnification, Governing Law, Non-Compete, Termination for Convenience, and Liability Caps. Every clause links directly to its source page and paragraph.
          </p>
        </ScrollReveal>

        {/* Feature 2 - Span 1 */}
        <ScrollReveal
          delayMs={200}
          className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)]"
        >
          <span className="relative flex size-12 items-center justify-center rounded-xl bg-surface-3 border border-[var(--border)] text-fg mb-6 group-hover:text-[var(--accent)] transition-colors">
            <GitCompare className="size-6" />
          </span>
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Pillar 2</div>
          <h3 className="text-xl font-bold text-fg">Multi-Draft Comparison</h3>
          <p className="mt-3 text-sm text-fg-muted leading-relaxed">
            Side-by-side redline comparison filtered by materiality level. Focus immediately on Major risk shifts rather than minor stylistic changes.
          </p>
        </ScrollReveal>

        {/* Feature 3 - Span 1 */}
        <ScrollReveal
          delayMs={300}
          className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)]"
        >
          <span className="relative flex size-12 items-center justify-center rounded-xl bg-surface-3 border border-[var(--border)] text-fg mb-6 group-hover:text-[var(--accent)] transition-colors">
            <Calendar className="size-6" />
          </span>
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Pillar 3</div>
          <h3 className="text-xl font-bold text-fg">Automated Obligation Timelines</h3>
          <p className="mt-3 text-sm text-fg-muted leading-relaxed">
            Never miss an auto-renewal window or 30-day cure period. ClauseIQX extracts every deadline, notice requirement, and milestone into a clean chronological view.
          </p>
        </ScrollReveal>

        {/* Feature 4 - Large Span 2 */}
        <ScrollReveal
          delayMs={400}
          className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] md:col-span-2 transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)] flex flex-col sm:flex-row sm:items-center gap-8"
        >
          <div className="flex-1">
            <span className="relative flex size-12 items-center justify-center rounded-xl bg-surface-3 border border-[var(--border)] text-fg mb-6 group-hover:text-[var(--accent)] transition-colors">
              <FileCheck className="size-6" />
            </span>
            <div className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Pillar 4</div>
            <h3 className="text-xl font-bold text-fg">Lawyer Consultation Brief Generator</h3>
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">
              Don't spend thousands in legal billable hours summarizing context. Export a comprehensive briefing pack highlighting unresolved risks, specific citations, and targeted legal questions for external counsel.
            </p>
          </div>
          <div className="hidden sm:flex size-32 shrink-0 items-center justify-center rounded-2xl bg-surface-3 border border-[var(--border)] shadow-inner text-accent">
            <BookOpen className="size-14 opacity-80" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
