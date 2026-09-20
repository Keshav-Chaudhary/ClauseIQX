import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, FileSearch, Sparkles, Scale, Database, Lock, EyeOff } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "How It Works — ClauseIQX Architecture & Pipeline",
  description: "Learn how ClauseIQX extracts, grounds, and analyzes contracts with zero hallucinations and complete data privacy.",
};

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[radial-gradient(ellipse_at_top_right,_var(--accent-subtle),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_var(--accent-subtle),_transparent_50%)]">
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-5 blur-[100px]" />
        <div className="mx-auto max-w-7xl px-4 pt-24 pb-20 lg:px-8 text-center custom-fade-in">
          <Badge tone="accent" className="mb-4 text-xs font-black uppercase tracking-[0.2em]">
            System Architecture
          </Badge>
          <h1 className="mt-4 text-balance text-4xl sm:text-5xl font-black tracking-tight text-fg lg:text-7xl">
            Evidence-First.<br />
            <span className="text-[var(--accent)]">Zero Hallucinations.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-pretty text-base sm:text-lg text-fg-muted lg:text-xl leading-relaxed">
            ClauseIQX is engineered to bridge the gap between dense contractual prose and decisive executive action. By coupling deterministic document grounding with cutting-edge LLMs, we ensure every claim cites its exact passage.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/workspace"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-bold text-accent-fg shadow-md transition-all hover:bg-accent-strong"
            >
              Open Workspace
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
            The Technology
          </div>
          <h2 className="text-3xl font-black tracking-tight text-fg sm:text-4xl">
            Core Technical Pillars of the Platform
          </h2>
          <p className="mt-4 text-base text-fg-muted">
            Designed to empower in-house counsel, operations leads, and founders with trusted legal intelligence.
          </p>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Pillar 1 */}
          <ScrollReveal
            delayMs={100}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)]"
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[var(--accent-subtle)] blur-[50px] transition-all group-hover:scale-125" />
            <span className="relative flex size-12 items-center justify-center rounded-xl bg-surface-3 border border-[var(--border)] text-[var(--accent)] mb-6">
              <FileSearch className="size-6" />
            </span>
            <h3 className="text-2xl font-bold text-fg mb-3">Deterministic Passage Grounding</h3>
            <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
              Every extraction links directly to a verified page and paragraph coordinate. If a provision cannot be cited directly to an authentic passage in the original text, the engine refuses to report it.
            </p>
          </ScrollReveal>

          {/* Pillar 2 */}
          <ScrollReveal
            delayMs={200}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)]"
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[var(--accent-subtle)] blur-[50px] transition-all group-hover:scale-125" />
            <span className="relative flex size-12 items-center justify-center rounded-xl bg-surface-3 border border-[var(--border)] text-[var(--accent)] mb-6">
              <Sparkles className="size-6" />
            </span>
            <h3 className="text-2xl font-bold text-fg mb-3">Dual-Level Reading Toggles</h3>
            <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
              Switch seamlessly between non-lawyer plain language summaries and comprehensive statutory legal breakdowns without sacrificing precision or nuance.
            </p>
          </ScrollReveal>

          {/* Pillar 3 */}
          <ScrollReveal
            delayMs={300}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)]"
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[var(--accent-subtle)] blur-[50px] transition-all group-hover:scale-125" />
            <span className="relative flex size-12 items-center justify-center rounded-xl bg-surface-3 border border-[var(--border)] text-[var(--accent)] mb-6">
              <Lock className="size-6" />
            </span>
            <h3 className="text-2xl font-bold text-fg mb-3">Zero Model-Training Guarantee</h3>
            <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
              Your confidential documents and proprietary contracts are never used to train foundation models. All data is processed statelessly and purged according to your customized retention policy.
            </p>
          </ScrollReveal>

          {/* Pillar 4 */}
          <ScrollReveal
            delayMs={400}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-faint)] bg-surface-2 p-8 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-md)]"
          >
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[var(--accent-subtle)] blur-[50px] transition-all group-hover:scale-125" />
            <span className="relative flex size-12 items-center justify-center rounded-xl bg-surface-3 border border-[var(--border)] text-[var(--accent)] mb-6">
              <Scale className="size-6" />
            </span>
            <h3 className="text-2xl font-bold text-fg mb-3">Attorney Collaboration Packager</h3>
            <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
              ClauseIQX acts as an accelerator, not an unlicensed practitioner. It equips you with high-value, structured briefing packs and specific questions to make your consultations with qualified lawyers 10x faster and cheaper.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Safety & Compliance Checklist */}
      <section className="bg-surface-2 border-t border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-fg">
              Enterprise Governance & Security Standards
            </h3>
            <p className="mt-3 text-sm text-fg-muted">
              Built from the ground up for strict confidentiality and data integrity.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <EyeOff className="size-8 text-accent mb-4" />
              <h4 className="font-bold text-fg text-base mb-2">Ephemeral Processing</h4>
              <p className="text-xs text-fg-muted leading-relaxed">
                Documents can be configured for instant purge immediately following analysis generation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border">
              <Database className="size-8 text-accent mb-4" />
              <h4 className="font-bold text-fg text-base mb-2">Isolated Tenancy</h4>
              <p className="text-xs text-fg-muted leading-relaxed">
                Project data, metadata, and embeddings are isolated per workspace with strict ACL boundaries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border">
              <ShieldCheck className="size-8 text-positive mb-4" />
              <h4 className="font-bold text-fg text-base mb-2">Auditable Citations</h4>
              <p className="text-xs text-fg-muted leading-relaxed">
                Every extracted statement maintains a permanent cryptographic link back to raw source coordinates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h3 className="text-3xl font-extrabold text-fg">
            Ready to review your agreements?
          </h3>
          <p className="mt-4 text-fg-muted text-base">
            Upload your PDF or DOCX file to experience ClauseIQX contract intelligence first hand.
          </p>
          <div className="mt-8">
            <Link
              href="/workspace"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-bold text-accent-fg shadow-md transition-all hover:bg-accent-strong"
            >
              Launch ClauseIQX Workspace
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
