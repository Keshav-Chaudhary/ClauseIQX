"use client";

import React, { useState } from "react";
import { Sparkles, X, BrainCircuit, CheckCircle2, ShieldAlert } from "lucide-react";

export interface AIExplanationData {
  title: string;
  dataInputs: string[];
  prediction: string;
  confidence: number;
  reasoning: string;
}

interface ExplainAIProps {
  explanation?: AIExplanationData;
}

const DEFAULT_EXPLANATION: AIExplanationData = {
  title: "AI Analysis & Fact-Check for Tenancy Agreement",
  dataInputs: [
    "Scanned pages and paragraphs from your uploaded Delhi rent agreement",
    "Standard Indian Rental Practices & Model Tenancy Guidelines",
    "Delhi Rent Control & Transfer of Property Act Rules",
  ],
  prediction: "Section 7.2 forfeits 100% of your ₹90,000 security deposit if you vacate before 6 months.",
  confidence: 96,
  reasoning: "The agreement requires an 11-month term with an aggressive 6-month lock-in penalty. If you move out early, the landlord can withhold your entire deposit without proving actual damages. Suggested: Negotiate early exit to 1 month notice rent only.",
};

export function ExplainAIButton({ explanation = DEFAULT_EXPLANATION }: ExplainAIProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 rounded-full border border-[var(--accent-line)] bg-surface/80 backdrop-blur-md px-3.5 py-1.5 shadow-[0_0_15px_var(--accent-subtle)] transition-all hover:bg-surface hover:shadow-[0_0_25px_var(--accent-subtle)] hover:scale-105"
      >
        <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-10 blur-sm group-hover:opacity-20 transition-opacity" />
        <Sparkles className="size-3.5 text-[var(--accent)]" />
        <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
          Explain AI
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-accent-subtle border border-accent-line text-accent flex items-center justify-center">
                  <BrainCircuit className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-fg">AI Reasoning Chain Explained</h3>
                  <p className="text-xs text-fg-muted">Transparent, auditable deterministic inference</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-5">
              {/* Step 1: Data Inputs */}
              <div>
                <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-widest">
                  Phase 1 · Verified Data Inputs
                </span>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {explanation.dataInputs.map((input, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-border bg-surface-2 text-xs text-fg font-medium flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-positive shrink-0" />
                      <span className="truncate">{input}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Prediction */}
              <div className="p-4 rounded-2xl border border-caution-line bg-caution-subtle/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-caution uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5" />
                    Phase 2 · Model Prediction
                  </span>
                  <span className="text-xs font-black text-positive bg-positive-subtle border border-positive-line px-2 py-0.5 rounded-full">
                    {explanation.confidence}% Confidence
                  </span>
                </div>
                <p className="text-sm font-bold text-fg leading-snug">
                  {explanation.prediction}
                </p>
              </div>

              {/* Step 3: Legal Reasoning */}
              <div>
                <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-widest">
                  Phase 3 · Grounded Legal Reasoning
                </span>
                <p className="mt-2 text-sm text-fg-muted leading-relaxed p-4 rounded-2xl bg-surface-2 border border-border">
                  {explanation.reasoning}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-full bg-accent text-accent-fg font-bold text-xs shadow hover:bg-accent-strong transition-colors"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
