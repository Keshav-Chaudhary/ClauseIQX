'use client';

import React, { useState } from 'react';
import {
  Search,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  BookmarkPlus,
  X,
  CheckCircle2,
  Info,
  Upload,
  Download,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { CitationPill } from '../CitationViewer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ExplainAIButton } from '../ui/ExplainAIButton';
import { ScrollReveal } from '../ui/ScrollReveal';

export interface ReviewPointItem {
  id: string;
  topic: string;
  severity: 'high' | 'medium' | 'standard';
  observation: string;
  whyItMatters: string;
  discussionPoint: string;
  negotiationScript: string;
  chunkId: string;
  page: number;
}

const DEFAULT_INDIAN_TENANCY_REVIEW_POINTS: ReviewPointItem[] = [
  {
    id: 'rp_01',
    topic: 'Unfair Lock-in Penalty & Deposit Forfeiture (§ 3.2)',
    severity: 'high',
    observation: 'If you move out before 6 months, the landlord forfeits your entire ₹76,000 security deposit AND demands rent for all remaining lock-in months.',
    whyItMatters: 'If your job or personal situation changes unexpectedly during the first 6 months, you face a double penalty (losing 2 months deposit + paying extra rent).',
    discussionPoint: 'Ask the landlord to cap the early exit penalty to 1 month rent maximum upon giving 30 days written notice.',
    negotiationScript: 'Hi Uncle/Landlord, regarding Clause 3 (Lock-in): Could we please update the early exit clause so that if I give 30 days written notice, the penalty is capped at 1 month rent rather than losing the entire deposit plus remaining months? That will give both of us clarity.',
    chunkId: 'chk_lockin_03',
    page: 2,
  },
  {
    id: 'rp_02',
    topic: 'Uncapped Painting & Wear-and-Tear Deductions (§ 2.4)',
    severity: 'high',
    observation: 'The deposit refund clause allows the landlord to deduct repainting costs without excluding normal everyday wear and tear.',
    whyItMatters: 'Landlords frequently deduct ₹15,000–₹25,000 for full repainting when tenants move out, even for short 11-month stays with clean walls.',
    discussionPoint: 'Add explicit wording that normal wear & tear cannot be deducted, and painting deductions only apply if walls are intentionally damaged or stained.',
    negotiationScript: 'Hi Landlord, regarding Clause 2 (Deposit Refund): Can we add a line stating "Normal wear and tear from everyday living shall not be deducted from the security deposit, and wall repainting deductions apply only for intentional structural damage"?',
    chunkId: 'chk_deposit_02',
    page: 1,
  },
  {
    id: 'rp_03',
    topic: 'Unspecified Mode of Written Notice (§ 6.1)',
    severity: 'medium',
    observation: 'Clause 6 requires 1 month written notice, but does not state whether WhatsApp or Email is valid written notice.',
    whyItMatters: 'Landlords can claim they did not receive physical registered post on time, delaying your 30-day countdown and deposit refund.',
    discussionPoint: 'Explicitly specify that written notice sent via WhatsApp or Email to the registered contact details is legally binding.',
    negotiationScript: 'Regarding Clause 6 (Notice): Let us add "Notice delivered via WhatsApp message or Email to the registered numbers/emails in this agreement shall be deemed valid written notice."',
    chunkId: 'chk_notice_06',
    page: 3,
  },
  {
    id: 'rp_04',
    topic: 'Sub-meter Electricity Surcharge Verification (§ 5.1)',
    severity: 'medium',
    observation: 'Tenant pays electricity as per sub-meter, but agreement does not attach the latest official BSES bill copy.',
    whyItMatters: 'Ensures the landlord charges exact government slab rates (BSES Rajdhani) without adding arbitrary commercial surcharges.',
    discussionPoint: 'Attach a copy of the last official BSES electricity bill as Annexure-A to verify starting meter reading.',
    negotiationScript: 'Can we please attach the last paid BSES electricity bill copy as Annexure-A and note down the initial sub-meter reading on handover day?',
    chunkId: 'chk_utility_05',
    page: 2,
  },
  {
    id: 'rp_05',
    topic: 'Joint Walkthrough & Key Handover Clearance Slip (§ 2.3)',
    severity: 'standard',
    observation: 'Deposit refund is promised within 7 working days after vacating, but no physical handover inspection slip is mentioned.',
    whyItMatters: 'Conducting a joint inspection on your move-out day avoids post-vacating disputes about pre-existing scratches or fixtures.',
    discussionPoint: 'Add a condition that a joint physical inspection will be conducted on move-out day and a written clearance note signed.',
    negotiationScript: 'Let us add a brief note: "Both parties agree to conduct a joint physical walkthrough on key handover day and sign a written property clearance note."',
    chunkId: 'chk_deposit_02',
    page: 1,
  },
  {
    id: 'rp_06',
    topic: 'Mutual Conciliation Before Formal Arbitration (§ 8.2)',
    severity: 'standard',
    observation: 'Disputes are referred directly to a Sole Arbitrator under the Arbitration Act 1996 in New Delhi.',
    whyItMatters: 'Formal arbitration can cost ₹20,000+ in fees, which is disproportionate for minor security deposit disagreements.',
    discussionPoint: 'Mandate a compulsory 15-day informal conciliation period before either party can initiate formal arbitration.',
    negotiationScript: 'In Clause 8 (Disputes): Can we insert "Parties shall attempt mutual conciliation within 15 days before initiating formal arbitration proceedings"?',
    chunkId: 'chk_dispute_08',
    page: 4,
  },
];

interface ReviewPointsTabProps {
  reviewPoints?: ReviewPointItem[];
  onOpenUpload?: () => void;
  onOpenExport?: () => void;
}

export const ReviewPointsTab: React.FC<ReviewPointsTabProps> = ({
  reviewPoints = DEFAULT_INDIAN_TENANCY_REVIEW_POINTS,
  onOpenUpload,
  onOpenExport,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [briefedIds, setBriefedIds] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ message: string; tone: 'positive' | 'caution' | 'info' } | null>(null);

  const displayPoints = reviewPoints.length > 0 ? reviewPoints : DEFAULT_INDIAN_TENANCY_REVIEW_POINTS;

  const showFeedback = (message: string, tone: 'positive' | 'caution' | 'info' = 'positive') => {
    setFeedback({ message, tone });
    setTimeout(() => setFeedback(null), 3500);
  };

  const filtered = displayPoints.filter((pt) => {
    const matchesSeverity = selectedSeverity === 'all' || pt.severity === selectedSeverity;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      pt.topic.toLowerCase().includes(searchLower) ||
      pt.observation.toLowerCase().includes(searchLower) ||
      pt.whyItMatters.toLowerCase().includes(searchLower) ||
      pt.discussionPoint.toLowerCase().includes(searchLower);

    return matchesSeverity && matchesSearch;
  });

  const handleCopyScript = (pt: ReviewPointItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pt.negotiationScript);
      setCopiedId(pt.id);
      showFeedback(`Copied negotiation script for "${pt.topic}" to clipboard!`, 'positive');
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleBriefToggle = (pt: ReviewPointItem) => {
    const nextState = !briefedIds[pt.id];
    setBriefedIds((prev) => ({ ...prev, [pt.id]: nextState }));
    if (nextState) {
      showFeedback(`Added "${pt.topic}" to your lawyer consultation briefing!`, 'positive');
    } else {
      showFeedback(`Removed "${pt.topic}" from briefing checklist.`, 'info');
    }
  };

  const highCount = displayPoints.filter((p) => p.severity === 'high').length;
  const mediumCount = displayPoints.filter((p) => p.severity === 'medium').length;
  const standardCount = displayPoints.filter((p) => p.severity === 'standard').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification Banner — Matching Overview Page */}
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
              Points to Double Check & Review
            </h1>
            <Badge tone="caution" className="text-[10px] font-bold uppercase tracking-wider">
              {displayPoints.length} Review Points
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            Notable clauses and terms in your rent agreement that warrant clarification or negotiation before signing.
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
                showFeedback('Preparing review points report for export...', 'positive');
                onOpenExport();
              }}
              className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
            >
              <Download className="size-3.5" />
              Export Points
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
            onClick={() => showFeedback('Objective Framing: Review points highlight clauses that benefit from clarification. They do not declare a contract invalid.', 'info')}
            className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 shadow-sm hover:bg-amber-500/20 transition-colors"
          >
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            Objective Legal Framing
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
                <AlertTriangle className="size-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-fg">
                  Review & Negotiation Summary
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                We identified {displayPoints.length} key areas in your Indian Tenancy Agreement where minor wording updates can protect your deposit and prevent exit disputes.
              </p>
            </div>

            {/* Stat Counters Row */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div
                onClick={() => {
                  setSelectedSeverity('high');
                  showFeedback('Filtered to 2 Red Flag terms needing attention.', 'caution');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-red-500/30 text-center cursor-pointer hover:border-red-500 transition-colors"
              >
                <div className="text-2xl font-black text-red-400 font-mono">{highCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-400/90 mt-0.5">Red Flags</div>
              </div>

              <div
                onClick={() => {
                  setSelectedSeverity('medium');
                  showFeedback('Filtered to 2 Moderate review items.', 'caution');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-amber-500/30 text-center cursor-pointer hover:border-amber-500 transition-colors"
              >
                <div className="text-2xl font-black text-amber-400 font-mono">{mediumCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mt-0.5">Attention</div>
              </div>

              <div
                onClick={() => {
                  setSelectedSeverity('standard');
                  showFeedback('Filtered to 2 Negotiation Opportunities.', 'positive');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-emerald-500/30 text-center cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <div className="text-2xl font-black text-emerald-400 font-mono">{standardCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mt-0.5">Negotiable</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter & Search Toolbar — Matching Overview Box Style */}
      <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              placeholder="Search review points by topic, observation, or negotiation advice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-surface-2 border border-[var(--border-strong)] rounded-2xl text-fg placeholder:text-fg-muted focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  showFeedback('Cleared search filter.', 'info');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg p-0.5"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Severity Pills Toolbar */}
          <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-[var(--border-faint)] overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity('all');
                showFeedback('Showing all review points.', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedSeverity === 'all' ? 'bg-surface shadow-sm text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              All Items ({displayPoints.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedSeverity('high');
                showFeedback('Filtered to 2 Red Flag terms.', 'caution');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedSeverity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-fg-muted hover:text-fg'
              }`}
            >
              ⚠️ Red Flags ({highCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedSeverity('medium');
                showFeedback('Filtered to 2 Moderate review terms.', 'caution');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedSeverity === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-fg-muted hover:text-fg'
              }`}
            >
              ⚡ Moderate ({mediumCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedSeverity('standard');
                showFeedback('Filtered to Negotiation Opportunities.', 'positive');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedSeverity === 'standard' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-fg-muted hover:text-fg'
              }`}
            >
              ✅ Negotiable ({standardCount})
            </button>
          </div>
        </div>
      </div>

      {/* Results Count & Reset Filter */}
      <div className="flex items-center justify-between text-xs text-fg-muted px-2">
        <span>Showing <strong className="text-fg">{filtered.length}</strong> of {displayPoints.length} review points</span>
        {(selectedSeverity !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSelectedSeverity('all');
              setSearchTerm('');
              showFeedback('Reset all filters to default.', 'info');
            }}
            className="text-accent hover:underline font-bold"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* No Results Fallback */}
      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-surface p-10 text-center space-y-3">
          <FileText className="size-10 text-fg-muted mx-auto opacity-50" />
          <h3 className="text-base font-bold text-fg">No review points match your query</h3>
          <p className="text-xs text-fg-muted max-w-sm mx-auto">
            Try adjusting your search terms or resetting severity filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSeverity('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Review Points List — Matching Overview Card Layout */}
      <div className="space-y-4">
        {filtered.map((item, idx) => {
          const isBriefed = !!briefedIds[item.id];

          const badgeTone =
            item.severity === 'high'
              ? 'critical'
              : item.severity === 'medium'
              ? 'caution'
              : 'positive';

          const borderGlow =
            item.severity === 'high'
              ? 'border-l-4 border-l-red-500'
              : item.severity === 'medium'
              ? 'border-l-4 border-l-amber-500'
              : 'border-l-4 border-l-emerald-500';

          return (
            <div
              key={item.id}
              className={`rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-7 shadow-sm transition-all hover:border-accent ${borderGlow} space-y-4`}
            >
              {/* Point Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-black tracking-wider">
                    Review Item #{idx + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-fg tracking-tight">
                    {item.topic}
                  </h3>
                  <Badge tone={badgeTone}>
                    {item.severity === 'high'
                      ? '⚠️ Red Flag'
                      : item.severity === 'medium'
                      ? '⚡ Attention Needed'
                      : '✅ Negotiation Opportunity'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <CitationPill chunkId={item.chunkId} page={item.page} snippet={item.observation} />
                </div>
              </div>

              {/* Observation & Why It Matters Split Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-1.5">
                  <div className="text-[10px] font-bold text-fg-subtle tracking-wider uppercase">
                    Exact Contract Finding
                  </div>
                  <p className="text-xs sm:text-sm text-fg leading-relaxed font-medium">
                    {item.observation}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-1.5">
                  <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
                    <HelpCircle className="size-3" />
                    <span>Why This Matters to You</span>
                  </div>
                  <p className="text-xs sm:text-sm text-fg-muted leading-relaxed font-normal">
                    {item.whyItMatters}
                  </p>
                </div>
              </div>

              {/* Practical Negotiation Advice Banner */}
              <div className="p-4 rounded-2xl border border-accent-line bg-surface-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1">
                    <Sparkles className="size-3" />
                    Suggested Action Before Signing
                  </span>
                  <span className="text-[10px] font-bold text-positive">96% Grounded</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-fg leading-relaxed">
                  {item.discussionPoint}
                </p>
              </div>

              {/* Ready-to-Send Negotiation Script Box */}
              <div className="p-4 rounded-2xl bg-surface-3 border border-[var(--border-faint)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted flex items-center gap-1">
                    <MessageSquare className="size-3 text-accent" />
                    Ready-to-Send WhatsApp / Email Message Script for Landlord
                  </span>
                </div>
                <p className="text-xs text-fg-muted italic font-mono leading-relaxed bg-surface/60 p-3 rounded-xl border border-border">
                  &quot;{item.negotiationScript}&quot;
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-[10px] uppercase tracking-wider text-fg-subtle font-bold">
                  Generated from document citations • Information only
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-3 gap-1.5 active:scale-95 transition-transform"
                    onClick={() => handleCopyScript(item)}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="size-3.5 text-positive" />
                        <span className="text-positive font-bold">Script Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy WhatsApp Script</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant={isBriefed ? 'primary' : 'outline'}
                    size="sm"
                    className={`text-xs h-8 px-3 gap-1.5 active:scale-95 transition-transform ${
                      isBriefed ? 'bg-blue-600 text-white border-blue-500' : ''
                    }`}
                    onClick={() => handleBriefToggle(item)}
                  >
                    <BookmarkPlus className="size-3.5" />
                    <span>{isBriefed ? 'Briefed ✅' : 'Add to Brief'}</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
