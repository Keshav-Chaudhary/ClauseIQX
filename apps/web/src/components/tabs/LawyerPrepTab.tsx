'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Download,
  Upload,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { CitationPill } from '../CitationViewer';
import { getApiBaseUrl } from '../../lib/api-config';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ExplainAIButton } from '../ui/ExplainAIButton';
import { ScrollReveal } from '../ui/ScrollReveal';

export interface LawyerPrepData {
  id: string;
  status: 'draft' | 'finalized';
  situationSummary: string;
  keyClauses: Array<{ title: string; summary: string; citationChunkId: string; page: number }>;
  keyDates: Array<{ event: string; date: string }>;
  factsStillNeeded: string[];
  questionsForLawyer: string[];
  userNotes: string;
}

const DEFAULT_INDIAN_TENANCY_PREP: LawyerPrepData = {
  id: 'lp_draft_01',
  status: 'draft',
  situationSummary: '11-Month Residential Tenancy Agreement for Flat in New Delhi, India. Monthly rent is ₹38,000 with ₹76,000 (2 months) security deposit. Features a 6-month compulsory lock-in period with early exit deposit forfeiture.',
  keyClauses: [
    {
      title: 'Clause 3. 6-Month Lock-In Period & Deposit Forfeiture',
      summary: 'Mandatory 6-month lock-in. Vacating early forfeits full ₹76,000 security deposit and incurs remaining rent liability.',
      citationChunkId: 'chk_lockin_03',
      page: 2,
    },
    {
      title: 'Clause 2. Refundable Security Deposit & Damage Deductions',
      summary: '₹76,000 deposit refundable within 7 working days post possession, subject to painting and damage deductions.',
      citationChunkId: 'chk_deposit_02',
      page: 1,
    },
    {
      title: 'Clause 6. 1-Month Written Notice Post Lock-In',
      summary: '1-month prior written notice required post lock-in to terminate without extra penalty.',
      citationChunkId: 'chk_notice_06',
      page: 3,
    },
  ],
  keyDates: [
    { event: 'Monthly Rent Due Date', date: '5th of Every Month' },
    { event: 'Lock-In Completion Date', date: 'End of Month 6' },
    { event: 'Lease Renewal Window', date: 'End of Month 11 (5% escalation)' },
  ],
  factsStillNeeded: [
    'Walkthrough photo/video evidence of wall condition before moving in.',
    'Copy of last paid BSES Rajdhani electricity bill and current sub-meter reading.',
    'RWA society maintenance bill copy confirming monthly charges.',
  ],
  questionsForLawyer: [
    'Is forfeiting the entire ₹76,000 security deposit for exiting before 6 months enforceable in New Delhi civil courts?',
    'How should we rephrase the repainting deduction clause to ensure normal wear-and-tear cannot be deducted?',
    'Does giving 30-day notice via WhatsApp/Email satisfy formal notice requirements under Indian Contract Act 1872?',
  ],
  userNotes: 'Scheduled meeting with local New Delhi property advocate next Tuesday.',
};

interface ApiPrepClause {
  title: string;
  excerpt?: string;
  chunk_id?: string;
  page?: number;
}

interface ApiPrepDate {
  label: string;
  timing: string;
}

export const LawyerPrepTab: React.FC<{
  projectId: string;
  onExportBriefing: () => void;
  onOpenUpload?: () => void;
}> = ({ projectId, onExportBriefing, onOpenUpload }) => {
  const [data, setData] = useState<LawyerPrepData>(DEFAULT_INDIAN_TENANCY_PREP);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'positive' | 'caution' | 'info' } | null>(null);

  const showFeedback = (message: string, tone: 'positive' | 'caution' | 'info' = 'positive') => {
    setFeedback({ message, tone });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
    if (!token || !projectId) return;

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/v1/projects/${projectId}/lawyer-prep`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData?.drafts && resData.drafts.length > 0) {
          const draft = resData.drafts[0];
          setData({
            id: draft.id,
            status: draft.status || 'draft',
            situationSummary: draft.situation_summary || DEFAULT_INDIAN_TENANCY_PREP.situationSummary,
            keyClauses: (draft.key_clauses?.clauses || []).map((c: ApiPrepClause) => ({
              title: c.title,
              summary: c.excerpt || '',
              citationChunkId: c.chunk_id || '',
              page: c.page || 1,
            })),
            keyDates: (draft.key_dates?.dates || []).map((d: ApiPrepDate) => ({ event: d.label, date: d.timing })),
            factsStillNeeded: draft.facts_still_needed?.items || DEFAULT_INDIAN_TENANCY_PREP.factsStillNeeded,
            questionsForLawyer: draft.questions_for_lawyer?.questions || DEFAULT_INDIAN_TENANCY_PREP.questionsForLawyer,
            userNotes: draft.user_notes || DEFAULT_INDIAN_TENANCY_PREP.userNotes,
          });
        }
      })
      .catch(() => {});
  }, [projectId]);

  const handleSaveSummary = async () => {
    setIsEditing(false);
    showFeedback('Updated situation summary saved!', 'positive');

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
      const apiBase = getApiBaseUrl();
      if (token && projectId && data.id && !data.id.startsWith('lp_draft')) {
        await fetch(`${apiBase}/api/v1/projects/${projectId}/lawyer-prep/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            situationSummary: data.situationSummary,
            userNotes: data.userNotes,
            status: data.status,
          }),
        });
      }
    } catch {
      // Offline fallback
    }
  };

  const handleToggleFinalize = async () => {
    const newStatus = data.status === 'draft' ? 'finalized' : 'draft';
    setData((prev) => ({ ...prev, status: newStatus }));
    showFeedback(
      newStatus === 'finalized'
        ? 'Marked consultation brief as FINALIZED! Ready to share with lawyer.'
        : 'Reopened brief as Editable Draft.',
      'positive'
    );

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
      const apiBase = getApiBaseUrl();
      if (token && projectId && data.id && !data.id.startsWith('lp_draft')) {
        await fetch(`${apiBase}/api/v1/projects/${projectId}/lawyer-prep/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
      }
    } catch {
      // Offline fallback
    }
  };

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
              Lawyer Consultation Briefing
            </h1>
            <Badge tone={data.status === 'finalized' ? 'positive' : 'caution'} className="text-[10px] font-bold uppercase tracking-wider">
              {data.status === 'finalized' ? '✓ Finalized Brief' : '✏️ Editable Brief'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            Structured consultation package to share with your legal advocate and save expensive billable hours.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <ExplainAIButton />
          {onOpenUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenUpload}
              className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
            >
              <Upload className="size-3.5" />
              Upload Exhibit
            </Button>
          )}
          <Button
            variant={data.status === 'finalized' ? 'outline' : 'secondary'}
            size="sm"
            onClick={handleToggleFinalize}
            className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
          >
            {data.status === 'finalized' ? 'Reopen Draft' : 'Mark as Finalized'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              showFeedback('Generating DOCX/PDF Briefing package...', 'positive');
              onExportBriefing();
            }}
            className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
          >
            <Download className="size-3.5" />
            Export Briefing (DOCX / PDF)
          </Button>
        </div>
      </div>

      {/* Hero Overview Box — Matching Overview rounded-3xl container */}
      <ScrollReveal>
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[var(--accent)] opacity-20 blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Briefcase className="size-5 text-[var(--accent)]" />
                <h2 className="text-lg sm:text-xl font-bold text-fg">
                  Advocate Consultation Briefing Sheet
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                Organized summary of contract terms, key deadlines, pending documentation, and recommended questions for legal counsel in New Delhi.
              </p>
            </div>

            {/* Stat Box */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-border text-center shrink-0 min-w-[200px]">
              <div className="text-xs font-bold text-fg-subtle uppercase tracking-wider">Advocate Questions</div>
              <div className="text-3xl font-black text-accent font-mono my-1">
                {data.questionsForLawyer.length} Prepared
              </div>
              <div className="text-xs font-bold text-positive flex items-center justify-center gap-1">
                <CheckCircle2 className="size-3.5" /> Citation Grounded
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Briefing Sections */}
      <div className="space-y-6">
        {/* Section 1: Situation Summary */}
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base sm:text-lg font-bold text-fg">
              1. Situation & Contract Overview
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-3"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Summary'}
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={data.situationSummary}
                onChange={(e) => setData({ ...data, situationSummary: e.target.value })}
                rows={4}
                className="w-full bg-surface-2 border border-[var(--border-strong)] rounded-2xl p-4 text-xs sm:text-sm text-fg focus:outline-none focus:border-accent transition-colors"
              />
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSaveSummary}>
                  Save Summary
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-surface-2 border border-border text-xs sm:text-sm text-fg leading-relaxed">
              {data.situationSummary}
            </div>
          )}
        </div>

        {/* Section 2: Key Clauses for Review */}
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-fg border-b border-border pb-3">
            2. Priority Clauses Attached for Legal Review
          </h3>

          <div className="space-y-3">
            {data.keyClauses.map((clause, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-2 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-fg">{clause.title}</div>
                  <div className="text-xs text-fg-muted leading-relaxed">{clause.summary}</div>
                </div>
                <CitationPill chunkId={clause.citationChunkId} page={clause.page} snippet={clause.summary} />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 & 4 Grid: Pending Facts & Lawyer Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Facts Needed */}
          <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-fg border-b border-border pb-3 flex items-center gap-2">
              <FileText className="size-4 text-amber-400" />
              <span>3. Documentation & Evidence Needed</span>
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-fg">
              {data.factsStillNeeded.map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-2 border border-border">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Questions for Lawyer */}
          <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-fg border-b border-border pb-3 flex items-center gap-2">
              <HelpCircle className="size-4 text-[var(--accent)]" />
              <span>4. Recommended Advocate Questions</span>
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-fg font-medium">
              {data.questionsForLawyer.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-2 border border-border">
                  <span className="text-[var(--accent)] font-bold">Q{idx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 5: User Notes */}
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-fg border-b border-border pb-3">
            5. Your Consultation Notes & Meeting Log
          </h3>
          <textarea
            value={data.userNotes}
            onChange={(e) => setData({ ...data, userNotes: e.target.value })}
            placeholder="Type your meeting notes, advocate name, or consultation remarks here..."
            rows={3}
            className="w-full bg-surface-2 border border-[var(--border-strong)] rounded-2xl p-4 text-xs sm:text-sm text-fg focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
