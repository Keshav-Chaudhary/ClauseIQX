'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { CitationPill } from '../CitationViewer';
import { getApiBaseUrl } from '../../lib/api-config';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ExplainAIButton } from '../ui/ExplainAIButton';
import { ScrollReveal } from '../ui/ScrollReveal';

export interface ComparisonDiffItem {
  id: string;
  section: string;
  changeType: 'added' | 'removed' | 'modified';
  materiality: 'material' | 'minor' | 'formatting_only';
  docAText?: string;
  docBText?: string;
  explanation: string;
  chunkIdA?: string;
  chunkIdB?: string;
  pageA?: number;
  pageB?: number;
}

const DEFAULT_INDIAN_TENANCY_DIFFS: ComparisonDiffItem[] = [
  {
    id: 'diff_1',
    section: 'Clause 1. Monthly Rent & Due Date',
    changeType: 'modified',
    materiality: 'material',
    docAText: '1. RENT: Licensee shall pay a monthly rent of Rs. 35,000/- on or before the 10th day of each calendar month.',
    docBText: '1. RENT: Licensee shall pay a monthly rent of Rs. 38,000/- in advance on or before the 5th day of each calendar month into Licensor bank account.',
    explanation: 'Monthly rent increased by ₹3,000/month (₹35,000 → ₹38,000), and due date compressed from 10th to 5th of each month.',
    chunkIdA: 'chk_v1_sec1',
    chunkIdB: 'chk_v2_sec1',
    pageA: 1,
    pageB: 1,
  },
  {
    id: 'diff_2',
    section: 'Clause 3. Lock-in Period & Early Exit Penalty',
    changeType: 'modified',
    materiality: 'material',
    docAText: '3. LOCK-IN: A lock-in period of 3 months shall apply. Post 3 months, 30 days notice required.',
    docBText: '3. TENURE & LOCK-IN: Mandatory lock-in of 6 months shall apply. Vacating before 6 months forfeits deposit and incurs full remaining lock-in rent.',
    explanation: 'Compulsory lock-in doubled from 3 months to 6 months, adding full deposit forfeiture penalty for early exit.',
    chunkIdA: 'chk_v1_sec3',
    chunkIdB: 'chk_v2_sec3',
    pageA: 2,
    pageB: 2,
  },
  {
    id: 'diff_3',
    section: 'Clause 2. Refundable Security Deposit',
    changeType: 'modified',
    materiality: 'minor',
    docAText: '2. DEPOSIT: Interest-free Security Deposit of Rs. 70,000/- deposited with Licensor.',
    docBText: '2. SECURITY DEPOSIT: Interest-free Security Deposit of Rs. 76,000/- deposited with Licensor, refundable within 7 working days.',
    explanation: 'Deposit adjusted from ₹70,000 to ₹76,000 to match 2 months updated rent (2 × ₹38,000).',
    chunkIdA: 'chk_v1_sec2',
    chunkIdB: 'chk_v2_sec2',
    pageA: 1,
    pageB: 1,
  },
  {
    id: 'diff_4',
    section: 'Clause 8. Dispute Jurisdiction Capitalization',
    changeType: 'modified',
    materiality: 'formatting_only',
    docAText: '8. jurisdiction shall be courts at new delhi, india',
    docBText: '8. JURISDICTION & ARBITRATION: Sole Arbitrator in NEW DELHI, INDIA.',
    explanation: 'Heading capitalized and formal arbitration procedure reference added; core New Delhi legal jurisdiction unchanged.',
    chunkIdA: 'chk_v1_sec8',
    chunkIdB: 'chk_v2_sec8',
    pageA: 4,
    pageB: 4,
  },
];

interface ApiComparisonChange {
  id: string;
  section_title?: string;
  change_type?: 'added' | 'removed' | 'modified';
  materiality_level?: 'material' | 'minor' | 'formatting_only';
  text_before?: string;
  text_after?: string;
  explanation?: string;
  chunk_a_id?: string;
  chunk_b_id?: string;
}

export const CompareTab: React.FC<{
  projectId: string;
  diffItems?: ComparisonDiffItem[];
  onOpenUpload?: () => void;
  onOpenExport?: () => void;
}> = ({ projectId, diffItems, onOpenUpload, onOpenExport }) => {
  const [items, setItems] = useState<ComparisonDiffItem[]>(diffItems || DEFAULT_INDIAN_TENANCY_DIFFS);
  const [materialityFilter, setMaterialityFilter] = useState<'all' | 'material' | 'minor' | 'formatting_only'>('all');
  const [feedback, setFeedback] = useState<{ message: string; tone: 'positive' | 'caution' | 'info' } | null>(null);

  const showFeedback = (message: string, tone: 'positive' | 'caution' | 'info' = 'positive') => {
    setFeedback({ message, tone });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
    if (!token || !projectId) return;

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/v1/projects/${projectId}/comparisons`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.comparisons && data.comparisons.length > 0) {
          const comp = data.comparisons[0];
          fetch(`${apiBase}/api/v1/projects/${projectId}/comparisons/${comp.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((cRes) => (cRes.ok ? cRes.json() : null))
            .then((compData) => {
              if (compData?.changes && compData.changes.length > 0) {
                const mapped: ComparisonDiffItem[] = compData.changes.map((c: ApiComparisonChange) => ({
                  id: c.id,
                  section: c.section_title || 'Section Comparison',
                  changeType: c.change_type || 'modified',
                  materiality: c.materiality_level || 'minor',
                  docAText: c.text_before || '',
                  docBText: c.text_after || '',
                  explanation: c.explanation || '',
                  chunkIdA: c.chunk_a_id,
                  chunkIdB: c.chunk_b_id,
                  pageA: 1,
                  pageB: 1,
                }));
                setItems(mapped);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [projectId]);

  const displayItems = items.length > 0 ? items : DEFAULT_INDIAN_TENANCY_DIFFS;
  const filtered = displayItems.filter(
    (item) => materialityFilter === 'all' || item.materiality === materialityFilter
  );

  const materialCount = displayItems.filter((i) => i.materiality === 'material').length;
  const minorCount = displayItems.filter((i) => i.materiality === 'minor').length;
  const formatCount = displayItems.filter((i) => i.materiality === 'formatting_only').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification Banner — Matching Overview */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 transition-all animate-in slide-in-from-top duration-200 ${
            feedback.tone === 'positive'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : feedback.tone === 'caution'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
          }`}
        >
          {feedback.tone === 'positive' ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          ) : feedback.tone === 'caution' ? (
            <AlertTriangle className="size-4 shrink-0 text-amber-400" />
          ) : (
            <Info className="size-4 shrink-0 text-[var(--accent)]" />
          )}
          <p className="text-xs sm:text-sm font-medium leading-snug">{feedback.message}</p>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-auto text-fg-muted hover:text-fg p-1 rounded-md"
            aria-label="Close notification"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Top Header: Matching Overview Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
              Contract Version Comparison
            </h1>
            <Badge tone="positive" className="text-[10px] font-bold uppercase tracking-wider">
              {displayItems.length} Differences Analyzed
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            Side-by-side comparison between Initial Draft 1.0 and Final Agreement 2.0 with materiality classification.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <ExplainAIButton />
          {onOpenExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                showFeedback('Exporting comparison diff report...', 'positive');
                onOpenExport();
              }}
              className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
            >
              <Download className="size-3.5" />
              Export Diff Report
            </Button>
          )}
          {onOpenUpload && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                showFeedback('Opening uploader to add Version 3 draft...', 'info');
                onOpenUpload();
              }}
              className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
            >
              <Upload className="size-3.5" />
              Upload Version B
            </Button>
          )}
          <button
            type="button"
            onClick={() => showFeedback('Dual Citation Grounding: Both Draft A and Revised B clauses are cited to page chunks.', 'positive')}
            className="flex items-center gap-2 rounded-full border border-accent-line bg-accent-subtle px-3 py-1 text-xs font-bold text-accent shadow-sm hover:bg-accent-subtle/80 transition-colors"
          >
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            Dual-Doc Citations
          </button>
        </div>
      </div>

      {/* Hero Overview Box — Matching Overview rounded-3xl container */}
      <ScrollReveal>
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[var(--accent)] opacity-20 blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <GitCompare className="size-5 text-[var(--accent)]" />
                <h2 className="text-lg sm:text-xl font-bold text-fg">
                  Draft 1.0 vs Final 2.0 Change Summary
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                Comparing <strong className="text-fg font-bold">Draft_Tenancy_V1.pdf</strong> against <strong className="text-fg font-bold">Delhi_Residential_Rent_Agreement_11Months.pdf</strong>.
              </p>
            </div>

            {/* Stat Box Row */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div
                onClick={() => {
                  setMaterialityFilter('material');
                  showFeedback('Filtered to 2 Material changes (Rent increase & Lock-in extension).', 'caution');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-red-500/30 text-center cursor-pointer hover:border-red-500 transition-colors"
              >
                <div className="text-2xl font-black text-red-400 font-mono">{materialCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-400/90 mt-0.5">Material 🔴</div>
              </div>

              <div
                onClick={() => {
                  setMaterialityFilter('minor');
                  showFeedback('Filtered to 1 Minor change (Deposit calculation).', 'info');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-amber-500/30 text-center cursor-pointer hover:border-amber-500 transition-colors"
              >
                <div className="text-2xl font-black text-amber-400 font-mono">{minorCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mt-0.5">Minor 🟡</div>
              </div>

              <div
                onClick={() => {
                  setMaterialityFilter('formatting_only');
                  showFeedback('Filtered to 1 Formatting change.', 'positive');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-emerald-500/30 text-center cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <div className="text-2xl font-black text-emerald-400 font-mono">{formatCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mt-0.5">Format ⚪</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Materiality Filter Toolbar — Matching Overview Box Style */}
      <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs font-bold text-fg-subtle uppercase tracking-wider">
            Filter Changes by Impact Level:
          </span>
          <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-[var(--border-faint)] overflow-x-auto">
            {(
              [
                { id: 'all', label: `All Changes (${displayItems.length})` },
                { id: 'material', label: `🔴 Material (${materialCount})` },
                { id: 'minor', label: `🟡 Minor (${minorCount})` },
                { id: 'formatting_only', label: `⚪ Format (${formatCount})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setMaterialityFilter(f.id);
                  showFeedback(`Filtered by ${f.label}`, 'info');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  materialityFilter === f.id ? 'bg-surface shadow-sm text-fg' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diff Cards List */}
      <div className="space-y-6">
        {filtered.map((item) => {
          const badgeTone =
            item.materiality === 'material'
              ? 'critical'
              : item.materiality === 'minor'
              ? 'caution'
              : 'neutral';

          const borderGlow =
            item.materiality === 'material'
              ? 'border-l-4 border-l-red-500'
              : item.materiality === 'minor'
              ? 'border-l-4 border-l-amber-500'
              : 'border-l-4 border-l-emerald-500';

          return (
            <div
              key={item.id}
              className={`rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-7 shadow-sm transition-all hover:border-accent ${borderGlow} space-y-4`}
            >
              {/* Diff Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-fg tracking-tight">
                    {item.section}
                  </h3>
                  <Badge tone={badgeTone}>
                    {item.materiality === 'material'
                      ? '🔴 Material Change'
                      : item.materiality === 'minor'
                      ? '🟡 Minor Adjustment'
                      : '⚪ Formatting Only'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {item.chunkIdA && (
                    <CitationPill
                      chunkId={item.chunkIdA}
                      page={item.pageA}
                      sourceDocName="Draft 1.0"
                      snippet={item.docAText}
                    />
                  )}
                  {item.chunkIdB && (
                    <CitationPill
                      chunkId={item.chunkIdB}
                      page={item.pageB}
                      sourceDocName="Final 2.0"
                      snippet={item.docBText}
                    />
                  )}
                </div>
              </div>

              {/* Analysis Explanation Box */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-1">
                <div className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="size-3" /> Impact Analysis
                </div>
                <p className="text-xs sm:text-sm text-fg font-medium leading-relaxed">
                  {item.explanation}
                </p>
              </div>

              {/* Side-by-Side Wording Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-1.5">
                  <div className="text-[10px] font-bold text-red-400 tracking-wider uppercase">
                    Document A (Initial Draft 1.0)
                  </div>
                  <div className="text-xs font-mono text-fg leading-relaxed whitespace-pre-wrap">
                    {item.docAText || '(No matching clause in Document A)'}
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1.5">
                  <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                    Document B (Final Agreement 2.0)
                  </div>
                  <div className="text-xs font-mono text-fg leading-relaxed whitespace-pre-wrap">
                    {item.docBText || '(No matching clause in Document B)'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
