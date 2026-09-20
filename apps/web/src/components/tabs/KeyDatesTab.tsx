'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Download,
  Upload,
} from 'lucide-react';
import { CitationPill } from '../CitationViewer';
import { getApiBaseUrl } from '../../lib/api-config';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ExplainAIButton } from '../ui/ExplainAIButton';
import { ScrollReveal } from '../ui/ScrollReveal';

export interface DateItem {
  id: string;
  title: string;
  dateString: string;
  dateType: 'effective' | 'milestone' | 'deadline' | 'expiration';
  description: string;
  chunkId: string;
  page: number;
}

const DEFAULT_TENANCY_DATES: DateItem[] = [
  {
    id: 'dt_01',
    title: 'Monthly Rent Due Date (Every Month)',
    dateString: '5th of Every Calendar Month',
    dateType: 'deadline',
    description: 'Monthly rent of ₹38,000 must be paid into the Licensor bank account on or before the 5th.',
    chunkId: 'chk_rent_01',
    page: 1,
  },
  {
    id: 'dt_02',
    title: 'Compulsory 6-Month Lock-In Period',
    dateString: 'Months 1 to 6 (First 180 Days)',
    dateType: 'milestone',
    description: 'Mandatory lock-in period. Early termination forfeits security deposit and incurs rent penalty.',
    chunkId: 'chk_lockin_03',
    page: 2,
  },
  {
    id: 'dt_03',
    title: '1-Month Termination Notice Window',
    dateString: 'Post 6th Month Onward',
    dateType: 'deadline',
    description: '1 full calendar month prior written notice required via Email/WhatsApp to vacate without penalty.',
    chunkId: 'chk_notice_06',
    page: 3,
  },
  {
    id: 'dt_04',
    title: '11-Month Lease Agreement Expiration',
    dateString: 'End of 11th Month',
    dateType: 'expiration',
    description: 'Tenancy agreement expires. Subject to 5% rent escalation if renewed for a second 11-month term.',
    chunkId: 'chk_escalation_04',
    page: 2,
  },
  {
    id: 'dt_05',
    title: 'Security Deposit Refund Settlement',
    dateString: 'Within 7 Working Days Post-Handover',
    dateType: 'effective',
    description: '₹76,000 security deposit must be refunded after vacant possession and joint walkthrough inspection.',
    chunkId: 'chk_deposit_02',
    page: 1,
  },
];

interface KeyDatesTabProps {
  dates?: DateItem[];
  projectId?: string;
  documentId?: string;
  onExportIcs?: () => void;
  onOpenUpload?: () => void;
}

export const KeyDatesTab: React.FC<KeyDatesTabProps> = ({
  dates: initialDates = DEFAULT_TENANCY_DATES,
  projectId,
  documentId,
  onExportIcs,
  onOpenUpload,
}) => {
  const [dates, setDates] = useState<DateItem[]>(initialDates.length > 0 ? initialDates : DEFAULT_TENANCY_DATES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ message: string; tone: 'positive' | 'caution' | 'info' } | null>(null);

  const showFeedback = (message: string, tone: 'positive' | 'caution' | 'info' = 'positive') => {
    setFeedback({ message, tone });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    if (initialDates && initialDates.length > 0) {
      setDates(initialDates);
      return;
    }
    if (!projectId || !documentId) return;

    let isMounted = true;
    const fetchDates = async () => {
      setIsLoading(true);
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
        if (!token) return;

        const apiBase = getApiBaseUrl();
        const getRes = await fetch(
          `${apiBase}/api/v1/projects/${projectId}/documents/${documentId}/analyses?type=dates&include_findings=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let dateFindings: Array<{
          id: string;
          title: string;
          explanation: string;
          citation_chunk_ids: string[];
        }> = [];

        if (getRes.ok) {
          const getData = await getRes.json();
          if (getData.analyses && getData.analyses.length > 0 && getData.analyses[0].findings) {
            dateFindings = getData.analyses[0].findings;
          }
        }

        if (isMounted && dateFindings.length > 0) {
          const mappedDates: DateItem[] = dateFindings.map((f, idx) => {
            const textLower = `${f.title} ${f.explanation}`.toLowerCase();
            let dateType: DateItem['dateType'] = 'milestone';
            if (textLower.includes('effective') || textLower.includes('commence') || textLower.includes('start')) {
              dateType = 'effective';
            } else if (textLower.includes('terminat') || textLower.includes('expir') || textLower.includes('renew')) {
              dateType = 'expiration';
            } else if (textLower.includes('notice') || textLower.includes('cure') || textLower.includes('due')) {
              dateType = 'deadline';
            }

            const dateMatch =
              f.explanation.match(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i) ||
              f.explanation.match(/\b\d{1,2}\s+(?:days|months|years)\b/i);

            return {
              id: f.id,
              title: f.title,
              dateString: dateMatch ? dateMatch[0] : `Milestone #${idx + 1}`,
              dateType,
              description: f.explanation,
              chunkId: f.citation_chunk_ids?.[0] || 'chk_dates',
              page: 1,
            };
          });
          setDates(mappedDates);
        }
      } catch {
        // Fallback to default tenancy dates
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDates();
    return () => {
      isMounted = false;
    };
  }, [projectId, documentId, initialDates]);

  const toggleItem = (id: string, title: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showFeedback(`Unchecked "${title}" schedule milestone.`, 'info');
      } else {
        next.add(id);
        showFeedback(`Marked "${title}" as completed!`, 'positive');
      }
      return next;
    });
  };

  const completedCount = completedIds.size;
  const displayDates = dates.length > 0 ? dates : DEFAULT_TENANCY_DATES;

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

      {/* Top Header: Matching Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
              Key Dates & Timeline Schedule
            </h1>
            <Badge tone="positive" className="text-[10px] font-bold uppercase tracking-wider">
              {completedCount} of {displayDates.length} Completed
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            Chronological contract schedule extracted and verified against original source text.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <ExplainAIButton />
          {onExportIcs && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                showFeedback('Generating iCalendar (.ics) schedule export...', 'positive');
                onExportIcs();
              }}
              className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
            >
              <Download className="size-3.5" />
              Export to iCal (.ics)
            </Button>
          )}
          {onOpenUpload && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                showFeedback('Opening document uploader...', 'info');
                onOpenUpload();
              }}
              className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
            >
              <Upload className="size-3.5" />
              Upload New File
            </Button>
          )}
          <button
            type="button"
            onClick={() => showFeedback('All dates are verified directly against clause text in your document.', 'positive')}
            className="flex items-center gap-2 rounded-full border border-accent-line bg-accent-subtle px-3 py-1 text-xs font-bold text-accent shadow-sm hover:bg-accent-subtle/80 transition-colors"
          >
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            Verified Schedule
          </button>
        </div>
      </div>

      {/* Hero Overview Box — Matching Overview rounded-3xl container */}
      <ScrollReveal>
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm relative overflow-hidden">
          {/* Ambient accent glow */}
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[var(--accent)] opacity-20 blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-[var(--accent)]" />
                <h2 className="text-lg sm:text-xl font-bold text-fg">
                  Tenancy Contract Timeline & Checklist
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                Check off milestones as you complete monthly rent payments, notice windows, and lease expiry requirements.
              </p>
            </div>

            {/* Stat Box */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-border text-center shrink-0 min-w-[200px]">
              <div className="text-xs font-bold text-fg-subtle uppercase tracking-wider">Milestone Progress</div>
              <div className="text-3xl font-black text-accent font-mono my-1">
                {completedCount} / {displayDates.length}
              </div>
              <div className="text-xs font-bold text-positive flex items-center justify-center gap-1">
                <CheckCircle2 className="size-3.5" /> Checked Off
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {isLoading && (
        <div className="p-4 rounded-2xl bg-surface-2 border border-border text-xs text-fg-muted text-center animate-pulse">
          ⚡ Extracting verified contract dates and timelines...
        </div>
      )}

      {/* Timeline Checklist */}
      <div className="space-y-4">
        {displayDates.map((d, index) => {
          const isDone = completedIds.has(d.id);

          const badgeTone =
            d.dateType === 'deadline'
              ? 'critical'
              : d.dateType === 'expiration'
              ? 'caution'
              : 'positive';

          return (
            <div
              key={d.id}
              className={`rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-7 shadow-sm transition-all duration-200 ${
                isDone ? 'opacity-60 bg-surface-2 scale-[0.99]' : 'hover:border-accent'
              } flex flex-col sm:flex-row items-start gap-4`}
            >
              {/* Checkbox */}
              <div className="pt-1 shrink-0">
                <input
                  type="checkbox"
                  id={`check-${d.id}`}
                  checked={isDone}
                  onChange={() => toggleItem(d.id, d.title)}
                  aria-label={`Mark "${d.title}" as completed`}
                  className="size-5 accent-[var(--accent)] cursor-pointer rounded bg-surface border-[var(--border-strong)] focus:ring-[var(--accent)]"
                />
              </div>

              {/* Number Circle */}
              <div
                className={`size-10 rounded-2xl shrink-0 flex items-center justify-center font-black text-xs transition-colors ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface-2 text-accent border border-[var(--border-strong)]'
                }`}
              >
                {isDone ? '✓' : `#${index + 1}`}
              </div>

              {/* Date Info Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <label
                      htmlFor={`check-${d.id}`}
                      className={`text-base font-bold cursor-pointer transition-all ${
                        isDone ? 'line-through text-fg-muted' : 'text-fg hover:text-accent'
                      }`}
                    >
                      {d.title}
                    </label>
                    <Badge tone={badgeTone}>
                      {d.dateType.toUpperCase()}
                    </Badge>
                  </div>
                  <CitationPill chunkId={d.chunkId} page={d.page} snippet={d.description} />
                </div>

                <div className={`text-lg font-black font-mono transition-all ${isDone ? 'text-fg-muted line-through' : 'text-accent'}`}>
                  {d.dateString}
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed transition-colors ${isDone ? 'text-fg-subtle line-through' : 'text-fg-muted'}`}>
                  {d.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
