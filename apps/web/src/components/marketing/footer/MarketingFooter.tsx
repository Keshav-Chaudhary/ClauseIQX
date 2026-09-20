import Link from "next/link";
import { ArrowRight, Scale, BookOpen } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-strong)] bg-surface-3 pt-12 pb-8 shadow-inner">
      {/* Background radial glow */}
      <div className="absolute bottom-0 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(circle,_var(--accent-subtle)_0%,_transparent_70%)] opacity-30 mix-blend-screen pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 md:px-8 relative z-10">
        {/* Newsletter Pulse Block */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 rounded-2xl border border-[var(--border-faint)] bg-surface-2 px-6 py-6 shadow-[var(--shadow-sm)] lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-fg">
              Stay ahead on legal intelligence standards.
            </h3>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              Subscribe to technical updates on clause taxonomies, grounding verification models, and contract analysis releases.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="email"
              placeholder="Enter your corporate email"
              className="flex-1 h-11 rounded-xl border border-[var(--border-strong)] bg-surface px-4 text-sm text-fg !outline-none transition-colors focus:border-[var(--accent)]"
            />
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-xl bg-fg px-6 text-sm font-bold text-bg transition-transform hover:scale-105 active:scale-95 shadow-[var(--shadow-sm)] shrink-0"
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand & Status Column */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-3 lg:pr-12">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-fg">
              <span className="flex size-7 items-center justify-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-subtle)] text-[var(--accent)]">
                <Scale className="size-4" />
              </span>
              <span>ClauseIQX</span>
            </Link>

            <p className="text-sm text-fg-muted leading-relaxed max-w-sm">
              An evidence-first contract intelligence system. Every extracted finding is grounded with exact document citations to eliminate AI hallucinations.
            </p>

            {/* Live System Status Badge */}
            <div className="flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-2 border border-[var(--border-strong)] w-fit mt-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--positive)] opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--positive)]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-fg">
                System Status: Grounding Engine Active
              </span>
            </div>
          </div>

          {/* Product Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold text-fg-muted tracking-widest uppercase">
              Product
            </h4>
            <nav aria-label="Footer Product" className="flex flex-col gap-2.5">
              <Link href="/workspace" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent flex items-center gap-1 group">
                Workspace
                <ArrowRight className="size-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
              <Link href="/workspace" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                Clauses Explorer
              </Link>
              <Link href="/workspace" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                Review Points
              </Link>
              <Link href="/workspace" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                Key Dates & Deadlines
              </Link>
            </nav>
          </div>

          {/* Capabilities Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold text-fg-muted tracking-widest uppercase">
              Capabilities
            </h4>
            <nav aria-label="Footer Capabilities" className="flex flex-col gap-2.5">
              <Link href="/how-it-works" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                How It Works
              </Link>
              <Link href="/workspace" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                Multi-Draft Compare
              </Link>
              <Link href="/workspace" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                Counsel Prep Pack
              </Link>
            </nav>
          </div>

          {/* Resources Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold text-fg-muted tracking-widest uppercase">
              Resources
            </h4>
            <nav aria-label="Footer Resources" className="flex flex-col gap-2.5">
              <Link href="/developer" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                Developer Architecture
              </Link>
              <Link href="/how-it-works" className="text-sm font-medium text-fg-subtle transition-colors hover:text-accent">
                How It Works
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-[var(--border-strong)] pt-8 sm:flex-row">
          <div className="flex gap-4">
            <Link aria-label="Documentation" href="/how-it-works" className="text-fg-muted hover:text-accent transition-transform hover:scale-110">
              <BookOpen className="size-4" />
            </Link>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5 text-center sm:text-right">
            <p className="text-xs font-semibold text-fg flex items-center gap-1.5 uppercase tracking-wide">
              &copy; {new Date().getFullYear()} ClauseIQX. All rights reserved.
            </p>
            <p className="text-[11px] text-fg-muted max-w-xl">
              Informational tool only. Does not provide legal advice or attorney-client representation.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
