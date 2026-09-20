import { ScrollReveal } from "@/components/ui/ScrollReveal";

function StatPulse({ value, label, subtitle }: { value: string; label: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
      <p className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-fg to-fg-subtle drop-shadow-sm">
        {value}
      </p>
      <p className="mt-2 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
        {label}
      </p>
      {subtitle && (
        <p className="mt-1 text-[11px] text-fg-muted font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function SocialProofSection() {
  return (
    <section className="bg-surface-2 border-b border-[var(--border)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-6 py-12 md:px-12">
        <ScrollReveal delayMs={100}>
          <StatPulse value="99.4%" label="Clause Extraction" subtitle="Pinpoint paragraph indexing" />
        </ScrollReveal>
        <div className="hidden h-12 w-px bg-[var(--border)] md:block" />

        <ScrollReveal delayMs={200}>
          <StatPulse value="<500ms" label="Analysis Latency" subtitle="Streaming token inference" />
        </ScrollReveal>
        <div className="hidden h-12 w-px bg-[var(--border)] md:block" />

        <ScrollReveal delayMs={300}>
          <StatPulse value="100%" label="Grounded Citations" subtitle="Never hallucinated facts" />
        </ScrollReveal>
        <div className="hidden h-12 w-px bg-[var(--border)] md:block" />

        <ScrollReveal delayMs={400}>
          <StatPulse value="Zero Data" label="Retention Guarantee" subtitle="GDPR & SOC2 type compliance" />
        </ScrollReveal>
      </div>
    </section>
  );
}
