import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--border)] bg-surface">
      <div className="absolute inset-0 bg-surface-2 -z-20" />
      <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_var(--accent-subtle)_0%,_transparent_70%)] opacity-40 mix-blend-screen" />

      <ScrollReveal className="mx-auto max-w-5xl px-4 py-24 sm:py-32 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-subtle px-4 py-1 text-xs font-bold uppercase tracking-widest text-accent">
          <Sparkles className="size-3.5" />
          Ready to deploy
        </div>

        <h2 className="text-4xl font-black tracking-tight text-fg sm:text-6xl uppercase drop-shadow-sm">
          Master the contract.<br />
          <span className="text-[var(--accent)]">Protect your organization.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-fg-muted font-medium leading-relaxed">
          Deploy ClauseIQX today. Upload your agreements to experience grounded clause extraction, automated risk scoring, and structured lawyer preparation.
        </p>

        <div className="mt-10 sm:mt-12 flex justify-center">
          <Link
            href="/workspace"
            className="group relative inline-flex h-14 sm:h-16 items-center justify-center gap-3 overflow-hidden rounded-full bg-[var(--accent)] px-10 sm:px-12 text-base sm:text-lg font-bold text-[var(--accent-fg)] shadow-[0_0_30px_var(--accent-line)] transition-all hover:scale-105 hover:bg-[var(--accent-strong)] hover:shadow-[0_0_40px_var(--accent-line)]"
          >
            Launch ClauseIQX Workspace
            <ArrowRight aria-hidden="true" className="size-5 sm:size-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
