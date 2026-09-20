"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, FileText, CheckCircle2, Sparkles, Scale, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-[radial-gradient(ellipse_at_top_right,_var(--accent-subtle),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_var(--accent-subtle),_transparent_50%)]">
      {/* Ambient background glow */}
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column: Headline & Action */}
          <div className="max-w-2xl stagger">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_0_15px_var(--accent-line)]">
                <Scale aria-hidden="true" className="size-4" />
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-[var(--accent)] drop-shadow-sm">
                Next-Gen Contract Intelligence
              </span>
            </div>

            <h1 className="mt-4 text-balance text-4xl sm:text-5xl font-black tracking-tight text-fg lg:text-6xl xl:text-7xl">
              From complex agreements to <span className="text-[var(--accent)]">actionable clarity.</span>
            </h1>

            <p className="mt-6 text-pretty text-base sm:text-lg text-fg-muted lg:text-xl leading-relaxed">
              ClauseIQX is an enterprise-grade contract intelligence platform. Instantly extract verified clauses, detect risk deviations, compare multi-party drafts, and prepare structured lawyer consultation briefs.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col items-stretch sm:items-center sm:flex-row gap-4">
              <Link
                href="/workspace"
                className="inline-flex h-12 sm:h-14 items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 text-base font-bold text-[var(--accent-fg)] shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_24px_var(--accent-line)] hover:bg-[var(--accent-strong)]"
              >
                Launch Workspace
                <ArrowRight aria-hidden="true" className="size-5" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-12 sm:h-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-surface-2 px-8 text-base font-semibold text-fg transition-colors hover:bg-surface-3"
              >
                How It Works
              </Link>
            </div>

            {/* Micro proof badges */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-semibold text-fg-muted">
              <span className="flex items-center gap-1.5 text-positive">
                <CheckCircle2 className="size-4" /> 100% Verifiable Source Citations
              </span>
              <span className="flex items-center gap-1.5 text-accent">
                <ShieldCheck className="size-4" /> Zero Data Retention Guarantee
              </span>
            </div>
          </div>

          {/* Right Column: Simulated Live Contract Copilot HUD */}
          <div className="relative hidden lg:block custom-fade-in">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--bg)] via-transparent to-transparent z-10 pointer-events-none rounded-xl" />
            <HeroContractCopilotHUD />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroContractCopilotHUD() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--accent-line)] bg-surface/85 backdrop-blur-xl p-1 shadow-[0_0_50px_rgba(99,102,241,0.18)] custom-rise">
      {/* Window Top Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border-strong)] bg-surface-2/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-500/80" />
            <div className="size-2.5 rounded-full bg-yellow-500/80" />
            <div className="size-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-3 text-[10px] font-bold tracking-widest text-fg-subtle uppercase">
            ClauseIQX Engine v2.4
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[var(--accent-line)] bg-[var(--accent-subtle)] px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
          Verified Analysis
        </span>
      </div>

      {/* Main Preview Screen */}
      <div className="p-5 space-y-4">
        {/* Document Header */}
        <div className="flex items-center justify-between rounded-xl bg-surface-2 border border-border p-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-accent-subtle flex items-center justify-center text-accent">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-fg">Delhi_Residential_Rent_Agreement.pdf</div>
              <div className="text-[11px] text-fg-muted">11-Month Tenancy · New Delhi, India</div>
            </div>
          </div>
          <Badge tone="positive" className="text-[10px] font-bold uppercase">
            Parsed & Grounded
          </Badge>
        </div>

        {/* Telemetry Metric Badges */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-surface-3 border border-border">
            <div className="text-[10px] font-bold text-fg-subtle uppercase">Clauses</div>
            <div className="text-xl font-black text-accent mt-0.5">34</div>
            <div className="text-[9px] text-positive">100% Extracted</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-3 border border-border">
            <div className="text-[10px] font-bold text-fg-subtle uppercase">Review Points</div>
            <div className="text-xl font-black text-caution mt-0.5">6</div>
            <div className="text-[9px] text-caution">Action items</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-3 border border-border">
            <div className="text-[10px] font-bold text-fg-subtle uppercase">Key Dates</div>
            <div className="text-xl font-black text-neutral mt-0.5">9</div>
            <div className="text-[9px] text-fg-muted">Auto-detected</div>
          </div>
        </div>

        {/* Live Clause Stream Item 1 */}
        <div className="p-3 rounded-xl border border-caution/40 bg-caution-subtle/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-caution" />
              <span className="text-xs font-bold text-fg">Limitation of Liability (§ 14.2)</span>
            </div>
            <Badge tone="caution" className="text-[9px]">High Impact</Badge>
          </div>
          <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
            "Neither party aggregate liability shall exceed total fees paid in preceding 12 months, excluding uncapped indemnification obligations."
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-fg-subtle">
            <span>Source citation: Page 31, Paragraph 4</span>
            <span className="text-positive font-bold">Confidence: 99.1%</span>
          </div>
        </div>

        {/* Live Clause Stream Item 2 */}
        <div className="p-3 rounded-xl border border-border bg-surface-2/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-accent" />
              <span className="text-xs font-bold text-fg">Indemnity & IP Defense (§ 12.1)</span>
            </div>
            <Badge tone="accent" className="text-[9px]">Standard Capped</Badge>
          </div>
          <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
            "Vendor shall defend and indemnify Customer against third-party claims alleging patent or trade secret infringement."
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-fg-subtle">
            <span>Source citation: Page 24, Paragraph 2</span>
            <span className="text-positive font-bold">Confidence: 98.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
