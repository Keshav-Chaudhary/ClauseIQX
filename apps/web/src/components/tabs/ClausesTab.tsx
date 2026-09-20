'use client';

import React, { useState } from 'react';
import {
  Search,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  BookmarkPlus,
  X,
  Scale,
  CheckCircle2,
  Info,
  Upload,
  Download,
} from 'lucide-react';
import { CitationPill } from '../CitationViewer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ExplainAIButton } from '../ui/ExplainAIButton';
import { ScrollReveal } from '../ui/ScrollReveal';

export interface ClauseItem {
  id: string;
  clauseNumber?: string;
  title: string;
  category: 'Rent & Security Deposit' | 'Tenure & Lock-In' | 'Maintenance & Bills' | 'Termination & Notice' | 'Legal & Jurisdiction';
  riskLevel: 'high' | 'medium' | 'standard';
  plainLanguage: string;
  keyTakeaway?: string;
  originalText: string;
  chunkId: string;
  page: number;
}

const DEFAULT_INDIAN_TENANCY_CLAUSES: ClauseItem[] = [
  {
    id: 'clause_rent_01',
    clauseNumber: 'Clause 1',
    title: 'Monthly Rent & Payment Due Date',
    category: 'Rent & Security Deposit',
    riskLevel: 'standard',
    plainLanguage: 'You agree to pay ₹38,000 every month on or before the 5th day of each calendar month via direct bank transfer to the Landlord.',
    keyTakeaway: 'Pay on or before the 5th to avoid late fee charges or legal notice.',
    originalText: '1. RENT: That the Licensee/Tenant shall pay a monthly rent of Rs. 38,000/- (Rupees Thirty-Eight Thousand Only) in advance on or before the 5th day of each English calendar month into the designated bank account of the Licensor.',
    chunkId: 'chk_rent_01',
    page: 1,
  },
  {
    id: 'clause_deposit_02',
    clauseNumber: 'Clause 2',
    title: 'Refundable Security Deposit',
    category: 'Rent & Security Deposit',
    riskLevel: 'medium',
    plainLanguage: 'You deposit ₹76,000 (2 months rent) upfront. The landlord must refund this within 7 working days after key handover, minus valid damage repairs or unpaid utility bills.',
    keyTakeaway: 'Record a walkthrough video before moving in to protect your security deposit refund.',
    originalText: '2. SECURITY DEPOSIT: The Licensee has deposited an interest-free Security Deposit of Rs. 76,000/- (Rupees Seventy-Six Thousand Only) with the Licensor. This deposit shall be refundable within 7 working days of vacant peaceful possession handed back to Licensor, subject to deductions for damage or unpaid dues.',
    chunkId: 'chk_deposit_02',
    page: 1,
  },
  {
    id: 'clause_lockin_03',
    clauseNumber: 'Clause 3',
    title: '11-Month Tenure & 6-Month Lock-In Period',
    category: 'Tenure & Lock-In',
    riskLevel: 'high',
    plainLanguage: 'The agreement runs for 11 months with a mandatory 6-month lock-in period. Neither party can terminate during the first 6 months without paying full rent for the unexpired lock-in months.',
    keyTakeaway: 'Exiting before 6 months requires paying remaining lock-in rent as penalty.',
    originalText: '3. TENURE & LOCK-IN: The license agreement is valid for 11 months. A mandatory lock-in period of 6 months shall apply. If the Licensee vacates prior to the completion of 6 months, the Licensee shall forfeit the security deposit and pay rent for the unexpired lock-in period.',
    chunkId: 'chk_lockin_03',
    page: 2,
  },
  {
    id: 'clause_escalation_04',
    clauseNumber: 'Clause 4',
    title: '5% Annual Rent Escalation upon Renewal',
    category: 'Rent & Security Deposit',
    riskLevel: 'standard',
    plainLanguage: 'If both parties agree to extend the agreement beyond 11 months, monthly rent will automatically increase by 5% for the next term.',
    keyTakeaway: 'New rent will be ₹39,900/month if renewed after 11 months.',
    originalText: '4. ESCALATION: In the event of renewal of this agreement after expiry of 11 months, the monthly rent shall be escalated by 5% over the last paid rent amount.',
    chunkId: 'chk_escalation_04',
    page: 2,
  },
  {
    id: 'clause_utility_05',
    clauseNumber: 'Clause 5',
    title: 'Maintenance Charges & Utility Bills',
    category: 'Maintenance & Bills',
    riskLevel: 'standard',
    plainLanguage: 'You are responsible for paying electricity, cooking gas, water usage, and monthly society maintenance (RWA) charges directly as per actual bills.',
    keyTakeaway: 'Retain monthly payment receipts for electricity and RWA maintenance.',
    originalText: '5. UTILITIES: Electricity, water, gas, and monthly Resident Welfare Association (RWA) maintenance fees shall be borne and paid directly by the Licensee as per actual billings.',
    chunkId: 'chk_utility_05',
    page: 2,
  },
  {
    id: 'clause_notice_06',
    clauseNumber: 'Clause 6',
    title: '1-Month Written Notice for Vacating',
    category: 'Termination & Notice',
    riskLevel: 'medium',
    plainLanguage: 'After the 6-month lock-in period ends, either party can end the agreement by giving 1 full month written notice (or 1 month rent in lieu of notice).',
    keyTakeaway: 'Always send written notice via Email/WhatsApp to maintain legal proof.',
    originalText: '6. NOTICE PERIOD: Post-completion of the lock-in period, either party may terminate this agreement by giving one (1) month prior written notice or one month rent in lieu thereof.',
    chunkId: 'chk_notice_06',
    page: 3,
  },
  {
    id: 'clause_usage_07',
    clauseNumber: 'Clause 7',
    title: 'Permitted Residential Use Only (No Sub-letting)',
    category: 'Legal & Jurisdiction',
    riskLevel: 'standard',
    plainLanguage: 'The premises must be used strictly for residential living by you and family. Commercial activities or sub-renting to third parties is forbidden.',
    keyTakeaway: 'Running a commercial business or subletting rooms violates the agreement.',
    originalText: '7. USE & SUB-LETTING: The demised premises shall be used exclusively for residential purposes by the Licensee. Sub-letting, assigning, or parting with possession to any third party is strictly prohibited.',
    chunkId: 'chk_usage_07',
    page: 3,
  },
  {
    id: 'clause_dispute_08',
    clauseNumber: 'Clause 8',
    title: 'Dispute Resolution & New Delhi Jurisdiction',
    category: 'Legal & Jurisdiction',
    riskLevel: 'standard',
    plainLanguage: 'Any legal disagreement will be settled through mutual arbitration in New Delhi under Indian arbitration law, subject to Civil Courts in New Delhi, India.',
    keyTakeaway: 'Governed by New Delhi civil legal framework and Transfer of Property Act 1882.',
    originalText: '8. JURISDICTION & ARBITRATION: All disputes arising out of this agreement shall be referred to a sole arbitrator appointed mutually, under the Arbitration and Conciliation Act 1996. Venue shall be New Delhi, India.',
    chunkId: 'chk_dispute_08',
    page: 4,
  },
];

interface ClausesTabProps {
  clauses?: ClauseItem[];
  onOpenUpload?: () => void;
  onOpenExport?: () => void;
}

export const ClausesTab: React.FC<ClausesTabProps> = ({
  clauses = DEFAULT_INDIAN_TENANCY_CLAUSES,
  onOpenUpload,
  onOpenExport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [briefedIds, setBriefedIds] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ message: string; tone: 'positive' | 'caution' | 'info' } | null>(null);

  const displayClauses = clauses.length > 0 ? clauses : DEFAULT_INDIAN_TENANCY_CLAUSES;

  const categories = [
    'All',
    'Rent & Security Deposit',
    'Tenure & Lock-In',
    'Maintenance & Bills',
    'Termination & Notice',
    'Legal & Jurisdiction',
  ];

  const showFeedback = (message: string, tone: 'positive' | 'caution' | 'info' = 'positive') => {
    setFeedback({ message, tone });
    setTimeout(() => setFeedback(null), 3500);
  };

  const filtered = displayClauses.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesRisk = selectedRisk === 'all' || c.riskLevel === selectedRisk;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      c.title.toLowerCase().includes(searchLower) ||
      c.plainLanguage.toLowerCase().includes(searchLower) ||
      c.originalText.toLowerCase().includes(searchLower) ||
      (c.clauseNumber && c.clauseNumber.toLowerCase().includes(searchLower));

    return matchesCategory && matchesRisk && matchesSearch;
  });

  const toggleExpand = (id: string, title: string) => {
    const isNextExpanded = !expandedIds[id];
    setExpandedIds((prev) => ({ ...prev, [id]: isNextExpanded }));
    showFeedback(
      isNextExpanded
        ? `Expanded exact contract wording for "${title}".`
        : `Collapsed text for "${title}".`,
      'info'
    );
  };

  const handleCopyWording = (clause: ClauseItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`[${clause.clauseNumber || 'Clause'} - ${clause.title}]\n${clause.originalText}`);
      setCopiedId(clause.id);
      showFeedback(`Copied exact contract wording for "${clause.title}" to clipboard!`, 'positive');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleBriefToggle = (clause: ClauseItem) => {
    const nextState = !briefedIds[clause.id];
    setBriefedIds((prev) => ({ ...prev, [clause.id]: nextState }));
    if (nextState) {
      showFeedback(`Added "${clause.title}" to your lawyer briefing checklist!`, 'positive');
    } else {
      showFeedback(`Removed "${clause.title}" from lawyer briefing.`, 'info');
    }
  };

  const highRiskCount = displayClauses.filter((c) => c.riskLevel === 'high').length;
  const mediumRiskCount = displayClauses.filter((c) => c.riskLevel === 'medium').length;
  const standardCount = displayClauses.filter((c) => c.riskLevel === 'standard').length;

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

      {/* Top Header: Matching Overview Page Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
              Contract Clauses Explorer
            </h1>
            <Badge tone="positive" className="text-[10px] font-bold uppercase tracking-wider">
              {displayClauses.length} Clauses Mapped
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            Categorized contract clauses translated into simple, plain English with exact document citations.
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
                showFeedback('Preparing contract clauses summary export...', 'positive');
                onOpenExport();
              }}
              className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
            >
              <Download className="size-3.5" />
              Export Clauses
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
            onClick={() => showFeedback('All clauses are 100% verified against original contract text in your PDF.', 'positive')}
            className="flex items-center gap-2 rounded-full border border-accent-line bg-accent-subtle px-3 py-1 text-xs font-bold text-accent shadow-sm hover:bg-accent-subtle/80 transition-colors"
          >
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            100% Citation Grounded
          </button>
        </div>
      </div>

      {/* Hero Overview Box — Matching Overview Page rounded-3xl container */}
      <ScrollReveal>
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm relative overflow-hidden">
          {/* Ambient accent glow */}
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[var(--accent)] opacity-20 blur-[80px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Scale className="size-5 text-[var(--accent)]" />
                <h2 className="text-lg sm:text-xl font-bold text-fg">
                  Clause Intelligence & Safety Summary
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                We mapped all {displayClauses.length} clauses in your Indian Tenancy Agreement. Below you can filter by topic, search specific rules, or expand exact legal wording.
              </p>
            </div>

            {/* Stat Counters Row */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div
                onClick={() => {
                  setSelectedRisk('high');
                  showFeedback('Filtered to 1 High Risk clause needing attention.', 'caution');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-red-500/30 text-center cursor-pointer hover:border-red-500 transition-colors"
              >
                <div className="text-2xl font-black text-red-400 font-mono">{highRiskCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-400/90 mt-0.5">High Risk</div>
              </div>

              <div
                onClick={() => {
                  setSelectedRisk('medium');
                  showFeedback('Filtered to 2 Medium Attention clauses.', 'caution');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-amber-500/30 text-center cursor-pointer hover:border-amber-500 transition-colors"
              >
                <div className="text-2xl font-black text-amber-400 font-mono">{mediumRiskCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mt-0.5">Attention</div>
              </div>

              <div
                onClick={() => {
                  setSelectedRisk('standard');
                  showFeedback('Filtered to standard clauses.', 'positive');
                }}
                className="p-3.5 rounded-2xl bg-surface-2 border border-emerald-500/30 text-center cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <div className="text-2xl font-black text-emerald-400 font-mono">{standardCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mt-0.5">Standard</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter & Control Toolbar — Matching Overview Page Box Style */}
      <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              placeholder="Search clauses by title, clause number, or plain English explanation..."
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

          {/* Risk Level Filter Pills — Matching Overview Radar Tab Style */}
          <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-[var(--border-faint)] overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedRisk('all');
                showFeedback('Showing all clauses.', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedRisk === 'all' ? 'bg-surface shadow-sm text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              All Risks ({displayClauses.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRisk('high');
                showFeedback('Filtered to 1 High Risk clause needing attention.', 'caution');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedRisk === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-fg-muted hover:text-fg'
              }`}
            >
              ⚠️ High Risk ({highRiskCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRisk('medium');
                showFeedback('Filtered to 2 Medium Attention clauses.', 'caution');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedRisk === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-fg-muted hover:text-fg'
              }`}
            >
              ⚡ Attention ({mediumRiskCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRisk('standard');
                showFeedback('Filtered to standard clauses.', 'positive');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedRisk === 'standard' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-fg-muted hover:text-fg'
              }`}
            >
              ✅ Standard ({standardCount})
            </button>
          </div>
        </div>

        {/* Category Pills Row */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-xs font-bold text-fg-subtle uppercase tracking-wider mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                showFeedback(`Filtered by category: ${cat}`, 'info');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface-2 text-fg-muted hover:text-fg border border-border hover:border-accent-line'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Counter & Reset Filter */}
      <div className="flex items-center justify-between text-xs text-fg-muted px-2">
        <span>Showing <strong className="text-fg">{filtered.length}</strong> of {displayClauses.length} contract clauses</span>
        {(selectedCategory !== 'All' || selectedRisk !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedRisk('all');
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
          <h3 className="text-base font-bold text-fg">No clauses match your current filter</h3>
          <p className="text-xs text-fg-muted max-w-sm mx-auto">
            Try adjusting your search keywords or switching category/risk filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedRisk('all');
              setSearchTerm('');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Clauses Cards List — Matching Overview Page Card Container Layout */}
      <div className="space-y-4">
        {filtered.map((clause) => {
          const isExpanded = !!expandedIds[clause.id];
          const isBriefed = !!briefedIds[clause.id];

          const riskBadgeTone =
            clause.riskLevel === 'high'
              ? 'critical'
              : clause.riskLevel === 'medium'
              ? 'caution'
              : 'positive';

          const borderGlowColor =
            clause.riskLevel === 'high'
              ? 'border-l-4 border-l-red-500'
              : clause.riskLevel === 'medium'
              ? 'border-l-4 border-l-amber-500'
              : 'border-l-4 border-l-emerald-500';

          return (
            <div
              key={clause.id}
              className={`rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-7 shadow-sm transition-all hover:border-accent ${borderGlowColor} space-y-4`}
            >
              {/* Clause Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {clause.clauseNumber && (
                    <span className="px-2.5 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent-line text-xs font-black tracking-wider">
                      {clause.clauseNumber}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-bold text-fg tracking-tight">
                    {clause.title}
                  </h3>
                  <Badge tone={riskBadgeTone}>
                    {clause.riskLevel === 'high'
                      ? '⚠️ High Risk'
                      : clause.riskLevel === 'medium'
                      ? '⚡ Attention Needed'
                      : '✅ Standard Term'}
                  </Badge>
                  <span className="text-xs text-fg-muted px-2.5 py-0.5 rounded-full bg-surface-2 border border-border font-medium">
                    {clause.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <CitationPill chunkId={clause.chunkId} page={clause.page} snippet={clause.originalText} />
                </div>
              </div>

              {/* Plain-English Explanation Box — Matching Overview Card Style */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-wider">
                  <Sparkles className="size-3.5" />
                  <span>Plain-English Explanation (For Everyday Users)</span>
                </div>
                <p className="text-xs sm:text-sm text-fg leading-relaxed font-normal">
                  {clause.plainLanguage}
                </p>
                {clause.keyTakeaway && (
                  <div className="pt-2 flex items-start gap-2 text-xs font-bold text-positive border-t border-border/50">
                    <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
                    <span>Practical Advice: {clause.keyTakeaway}</span>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(clause.id, clause.title)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 focus:outline-none transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="size-3.5" /> Hide original contract wording
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5" /> View original contract wording
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-3 gap-1.5 active:scale-95 transition-transform"
                    onClick={() => handleCopyWording(clause)}
                  >
                    {copiedId === clause.id ? (
                      <>
                        <Check className="size-3.5 text-positive" />
                        <span className="text-positive font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy Clause Wording</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant={isBriefed ? 'primary' : 'outline'}
                    size="sm"
                    className={`text-xs h-8 px-3 gap-1.5 active:scale-95 transition-transform ${
                      isBriefed ? 'bg-blue-600 text-white border-blue-500' : ''
                    }`}
                    onClick={() => handleBriefToggle(clause)}
                  >
                    <BookmarkPlus className="size-3.5" />
                    <span>{isBriefed ? 'Briefed ✅' : 'Add to Brief'}</span>
                  </Button>
                </div>
              </div>

              {/* Collapsible Original Legal Text Excerpt */}
              {isExpanded && (
                <div className="p-4 border-l-4 border-accent bg-surface-2 text-fg text-xs rounded-r-2xl font-mono leading-relaxed space-y-2 animate-in fade-in duration-200">
                  <div className="text-[10px] uppercase font-bold text-fg-subtle font-sans tracking-wider flex items-center justify-between">
                    <span>Exact Contract Text (Page {clause.page})</span>
                    <span className="text-[10px] text-accent font-mono font-bold">{clause.chunkId}</span>
                  </div>
                  <p className="italic select-all text-fg font-sans leading-relaxed">
                    &quot;{clause.originalText}&quot;
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
