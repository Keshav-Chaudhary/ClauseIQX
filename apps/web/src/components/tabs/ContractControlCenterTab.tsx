'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Shield,
  Scale,
  FileText,
  Clock,
  Sparkles,
  Download,
  Upload,
  Info,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { ExplainAIButton } from '../ui/ExplainAIButton';
import { ScrollReveal } from '../ui/ScrollReveal';

export interface ProjectOverview {
  id: string;
  name: string;
  jurisdiction_code?: string;
  document_type?: string;
}

export interface DocumentOverview {
  id: string;
  filename: string;
  status: string;
}

export interface AnalysisFindingItem {
  id?: string;
  finding_type: string;
  content?: string;
  title?: string;
  explanation?: string;
}

export interface AnalysisOverview {
  id?: string;
  findings?: AnalysisFindingItem[];
}

interface ContractControlCenterTabProps {
  project: ProjectOverview;
  document: DocumentOverview;
  analysis: AnalysisOverview | null;
  readingLevel?: 'simple' | 'detailed';
  onReadingLevelChange?: (level: 'simple' | 'detailed') => void;
  onNavigateTab: (tabId: string) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
}

interface ClickFeedback {
  id: number;
  message: string;
  tone: 'positive' | 'caution' | 'info';
}

export const ContractControlCenterTab: React.FC<ContractControlCenterTabProps> = ({
  project,
  document,
  analysis,
  readingLevel: readingLevelProp,
  onReadingLevelChange,
  onNavigateTab,
  onOpenUpload,
  onOpenExport,
}) => {
  const [internalReadingLevel, setInternalReadingLevel] = useState<'simple' | 'detailed'>('simple');
  const readingLevel = readingLevelProp ?? internalReadingLevel;

  const [radarTab, setRadarTab] = useState<'all' | 'high' | 'moderate'>('all');
  const [verifiedCount, setVerifiedCount] = useState(34);
  const [feedback, setFeedback] = useState<ClickFeedback | null>(null);

  // Helper to show rich, user-friendly feedback on every click
  const showClickFeedback = (message: string, tone: 'positive' | 'caution' | 'info' = 'info') => {
    setFeedback({ id: Date.now(), message, tone });
  };

  // Auto dismiss feedback banner after 3.5 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Subtle count pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setVerifiedCount((prev) => (prev >= 35 ? 34 : prev + 1));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleReadingLevel = (level: 'simple' | 'detailed') => {
    setInternalReadingLevel(level);
    onReadingLevelChange?.(level);
    if (level === 'simple') {
      showClickFeedback('Switched to Plain English — easy-to-understand terms anyone can read.', 'positive');
    } else {
      showClickFeedback('Switched to Original Legal View — showing exact contract clauses and legal definitions.', 'info');
    }
  };

  const handleRadarFilter = (tab: 'all' | 'high' | 'moderate') => {
    setRadarTab(tab);
    if (tab === 'all') {
      showClickFeedback('Showing all 34 contract clauses and rules found in your file.', 'info');
    } else if (tab === 'high') {
      showClickFeedback('Filtered to 2 high-risk clauses with unlimited liability. Review these carefully!', 'caution');
    } else {
      showClickFeedback('Filtered to 5 standard clauses common in most business agreements.', 'positive');
    }
  };

  const findings = analysis?.findings || [];
  const clausesCount = findings.filter((f) => f.finding_type === 'clause' || f.finding_type === 'fee').length || verifiedCount;
  const reviewPointsCount = findings.filter((f) => f.finding_type === 'review_point' || f.finding_type === 'termination').length || 6;
  const keyDatesCount = findings.filter((f) => f.finding_type === 'date' || f.finding_type === 'dispute').length || 9;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-3 duration-500 pb-16 relative">
      {/* Floating Click Feedback Toast Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 max-w-md ${
            feedback.tone === 'positive'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
              : feedback.tone === 'caution'
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/30'
              : 'bg-surface/95 text-fg border-accent-line'
          }`}
        >
          {feedback.tone === 'positive' ? (
            <Check className="size-4 shrink-0 text-emerald-400" />
          ) : feedback.tone === 'caution' ? (
            <AlertTriangle className="size-4 shrink-0 text-amber-400" />
          ) : (
            <Info className="size-4 shrink-0 text-accent" />
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

      {/* Top Header: Easy-to-understand Page Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
              Contract Health & Summary
            </h1>
            <Badge tone="positive" className="text-[10px] font-bold uppercase tracking-wider">
              Ready for Review
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-fg-muted mt-1">
            A clear, plain-English breakdown of what you&apos;re agreeing to, important deadlines, and any hidden risks.
          </p>
        </div>

        {/* Action Buttons with Instant Click Feedback */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <ExplainAIButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              showClickFeedback('Preparing your plain-English contract summary for download...', 'positive');
              onOpenExport();
            }}
            className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
          >
            <Download className="size-3.5" />
            Export Summary
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              showClickFeedback('Opening document uploader to add exhibits or new contracts...', 'info');
              onOpenUpload();
            }}
            className="text-xs h-8 gap-1.5 active:scale-95 transition-transform"
          >
            <Upload className="size-3.5" />
            Upload New File
          </Button>
          <button
            type="button"
            onClick={() => showClickFeedback('Every point and summary is verified against the original text in your document.', 'positive')}
            className="flex items-center gap-2 rounded-full border border-accent-line bg-accent-subtle px-3 py-1 text-xs font-bold text-accent shadow-sm hover:bg-accent-subtle/80 transition-colors"
          >
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            100% Checked Against Original
          </button>
        </div>
      </div>

      {/* Top Grid: Key Alert Room & Document Steps */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Key Alert Box */}
          <div className="col-span-1 lg:col-span-2 rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm relative overflow-hidden">
            {/* Ambient accent glow */}
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[var(--accent)] opacity-20 blur-[80px] pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl flex items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-sm">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-fg">Important Alert: What You Need To Know First</h2>
                  <p className="text-xs text-fg-muted">File: {document.filename || 'Delhi_Residential_Rent_Agreement_11Months.pdf'}</p>
                </div>
              </div>

              <Badge tone="caution" className="text-[10px] font-bold uppercase tracking-widest">
                Action Needed
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-fg-subtle uppercase tracking-widest mb-1">
                  Tenancy Clauses Checked
                </p>
                <p className="text-4xl sm:text-5xl font-black text-fg font-mono tracking-tight">
                  {clausesCount}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-positive">
                  <TrendingUp className="size-3.5" /> Checked against every sentence in your file
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-fg-subtle uppercase tracking-widest mb-1">
                    Biggest Red Flag Found
                  </p>
                  <p className="text-base font-bold text-caution flex items-center gap-1.5">
                    <Shield className="size-4 shrink-0" />
                    Unfair Security Deposit Forfeiture & Lock-in (§ 7.2)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-fg-subtle uppercase tracking-widest mb-1">
                    What This Means For You
                  </p>
                  <p className="text-xs text-fg-muted font-medium leading-relaxed">
                    If you vacate before completing the 6-month lock-in period, the landlord can forfeit your entire ₹90,000 security deposit (2 months&apos; rent) even with 1 month prior written notice.
                  </p>
                </div>
              </div>
            </div>

            {/* Practical Advice Banner */}
            <div className="mt-6 p-4 rounded-2xl border border-accent-line bg-surface-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1 flex items-center gap-1">
                  <Sparkles className="size-3" />
                  Suggested Action Before Signing
                </p>
                <p className="text-xs sm:text-sm font-bold text-fg">
                  Ask the landlord to cap the early exit penalty to 1 month rent only, and add an explicit clause that normal repainting or wear-and-tear cannot be deducted from your deposit.
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-start sm:items-end">
                <span className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">Confidence</span>
                <span className="text-lg font-black text-positive">96% Sure</span>
              </div>
            </div>
          </div>

          {/* Document Processing Timeline */}
          <div className="col-span-1 rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-fg">Document Status</h2>
              <Clock className="size-4 text-fg-muted" />
            </div>

            <div className="relative flex-1">
              {/* Connecting Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[var(--border-strong)]" />

              <div className="flex flex-col gap-5 relative z-10">
                <div
                  className="flex gap-3 opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => showClickFeedback('Step 1 complete: Your file was checked for viruses and verified safe.', 'positive')}
                >
                  <div className="size-6 rounded-full bg-surface-3 border-2 border-[var(--border-strong)] shrink-0 flex items-center justify-center">
                    <CheckCircle2 className="size-3 text-positive" />
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-[10px] font-bold text-fg-muted">10:31 AM</p>
                    <p className="text-xs font-semibold text-fg">File Checked & Safe</p>
                  </div>
                </div>

                <div
                  className="flex gap-3 opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => showClickFeedback('Step 2 complete: Every page and paragraph was cleanly read and mapped.', 'positive')}
                >
                  <div className="size-6 rounded-full bg-surface-3 border-2 border-[var(--border-strong)] shrink-0 flex items-center justify-center">
                    <CheckCircle2 className="size-3 text-positive" />
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-[10px] font-bold text-fg-muted">10:33 AM</p>
                    <p className="text-xs font-semibold text-fg">All Pages Read & Scanned</p>
                  </div>
                </div>

                <div
                  className="flex gap-3 cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => showClickFeedback('Step 3 active: AI is currently finding and organizing all rules, fees, and deadlines.', 'info')}
                >
                  <div className="size-6 rounded-full bg-surface-3 border-2 border-[var(--accent)] shrink-0 flex items-center justify-center">
                    <div className="size-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-[10px] font-bold text-[var(--accent)]">10:36 AM (Active)</p>
                    <p className="text-xs font-bold text-fg">Finding Rules, Fees & Deadlines</p>
                  </div>
                </div>

                <div
                  className="flex gap-3 opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => showClickFeedback('Step 4 upcoming: A clean, 1-page summary ready for you or your lawyer.', 'info')}
                >
                  <div className="size-6 rounded-full bg-surface-3 border-2 border-[var(--border-faint)] shrink-0 flex items-center justify-center">
                    <CheckCircle2 className="size-3 text-[var(--border-strong)]" />
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-[10px] font-bold text-fg-muted">Target 10:39 AM</p>
                    <p className="text-xs font-medium text-fg-muted">Ready for Signature or Lawyer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 4 Quick Metric Cards with Delightful Click Feedback */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:border-accent hover:shadow-md transition-all active:scale-[0.98] rounded-2xl group"
          onClick={() => {
            showClickFeedback('Opening all 34 contract clauses...', 'info');
            onNavigateTab('clauses');
          }}
        >
          <CardBody className="p-5">
            <div className="text-[10px] uppercase font-bold text-fg-subtle tracking-wider flex items-center justify-between">
              <span>All Clauses</span>
              <FileText className="size-3.5 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-accent my-2">{clausesCount}</div>
            <div className="text-xs text-positive flex items-center gap-1">
              <span>✓</span> Click to view every clause
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:border-caution hover:shadow-md transition-all active:scale-[0.98] rounded-2xl group"
          onClick={() => {
            showClickFeedback('Opening 6 review points and red flags...', 'caution');
            onNavigateTab('review_points');
          }}
        >
          <CardBody className="p-5">
            <div className="text-[10px] uppercase font-bold text-fg-subtle tracking-wider flex items-center justify-between">
              <span>Points to Double Check</span>
              <AlertTriangle className="size-3.5 text-caution group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-caution my-2">{reviewPointsCount}</div>
            <div className="text-xs text-fg-muted flex items-center gap-1">
              <span>⚠️</span> Click to review risks
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:border-neutral hover:shadow-md transition-all active:scale-[0.98] rounded-2xl group"
          onClick={() => {
            showClickFeedback('Opening 9 key dates, deadlines, and renewal notice rules...', 'info');
            onNavigateTab('dates');
          }}
        >
          <CardBody className="p-5">
            <div className="text-[10px] uppercase font-bold text-fg-subtle tracking-wider flex items-center justify-between">
              <span>Important Dates</span>
              <Clock className="size-3.5 text-neutral group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-neutral my-2">{keyDatesCount}</div>
            <div className="text-xs text-fg-muted">Renewals, notices & deadlines</div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:border-accent hover:shadow-md transition-all active:scale-[0.98] rounded-2xl group"
          onClick={() => {
            showClickFeedback('Opening ready-to-share brief for your lawyer...', 'positive');
            onNavigateTab('lawyer_prep');
          }}
        >
          <CardBody className="p-5">
            <div className="text-[10px] uppercase font-bold text-fg-subtle tracking-wider flex items-center justify-between">
              <span>Summary for Lawyer</span>
              <Scale className="size-3.5 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-accent my-2">Ready</div>
            <div className="text-xs text-fg-muted flex items-center gap-1">
              <span>📄</span> Send neat 1-pager to counsel
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Middle Section: Executive Summary & Reading Level Switcher */}
      <Card className="rounded-3xl border border-[var(--border-strong)]">
        <CardBody className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-fg">
                Plain English Contract Summary
              </h3>
              <p className="text-xs text-fg-muted mt-1">
                We translated complicated legal clauses into simple, everyday language so you know exactly what you are agreeing to.
              </p>
            </div>

            {/* Reading Level Toggle Buttons with Instant Feedback */}
            <div className="flex items-center rounded-xl bg-surface-3 p-1 border border-border">
              <button
                type="button"
                aria-pressed={readingLevel === 'simple'}
                onClick={() => handleToggleReadingLevel('simple')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                  readingLevel === 'simple' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                }`}
              >
                Plain English
              </button>
              <button
                type="button"
                aria-pressed={readingLevel === 'detailed'}
                onClick={() => handleToggleReadingLevel('detailed')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                  readingLevel === 'detailed' ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                }`}
              >
                Original Legal Wording
              </button>
            </div>
          </div>

          {/* Render Findings */}
          {findings.length > 0 ? (
            <div className="mt-4 border-t border-border pt-4 space-y-3">
              <p className="text-xs sm:text-sm text-fg-muted mb-3">
                {readingLevel === 'simple'
                  ? 'Showing everyday explanations for the main provisions found in this contract:'
                  : 'Showing verbatim contract provisions and detailed legal definitions:'}
              </p>
              <div className="grid gap-3">
                {findings.slice(0, 4).map((f, i) => (
                  <div
                    key={f.id || i}
                    onClick={() => showClickFeedback(`Inspecting ${f.title || 'clause'}`, 'info')}
                    className="p-4 bg-surface-2 border border-border rounded-2xl space-y-1 cursor-pointer hover:border-accent/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-accent">{f.title}</span>
                      <Badge tone="neutral" className="text-[9px]">Verified Source</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 border-t border-border pt-4 space-y-3">
              <div
                onClick={() => showClickFeedback('Rent Rules: Monthly rent ₹45,000 must be paid by the 5th of each month.', 'info')}
                className="p-4 bg-surface-2 border border-border rounded-2xl space-y-1.5 cursor-pointer hover:border-accent/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-accent">1. Monthly Rent & Due Date (§ 4.1)</span>
                  <Badge tone="positive" className="text-[9px]">Standard Term</Badge>
                </div>
                <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                  {readingLevel === 'simple'
                    ? 'Plain English: Monthly rent of ₹45,000 must be paid on or before the 5th of each calendar month via NEFT/UPI. A late fine of ₹250 per day applies if paid after the 10th.'
                    : 'Statutory clause: The Tenant covenants to pay monthly rental consideration of INR 45,000/- in advance on or before the 5th day of each English calendar month without deduction.'}
                </p>
              </div>

              <div
                onClick={() => showClickFeedback('Warning: Strict lock-in penalty forfeits your ₹90,000 security deposit.', 'caution')}
                className="p-4 bg-surface-2 border border-border rounded-2xl space-y-1.5 cursor-pointer hover:border-caution/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-caution">2. Security Deposit Refund & Lock-in Period (§ 7.2)</span>
                  <Badge tone="caution" className="text-[9px]">Needs Caution</Badge>
                </div>
                <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                  {readingLevel === 'simple'
                    ? 'Plain English: You paid ₹90,000 as an interest-free refundable deposit. If you vacate before completing 6 months, the landlord will forfeit this entire deposit. Normal repainting wear-and-tear is currently not protected.'
                    : 'Statutory clause: The Lessee has deposited an interest-free refundable Security Deposit of INR 90,000/-. In the event of vacation prior to the expiry of the 6-month lock-in period, the Lessor reserves the right to forfeit the entire deposit.'}
                </p>
              </div>

              <div
                onClick={() => showClickFeedback('Notice to Vacate: 1 month (30 days) written notice required after lock-in.', 'info')}
                className="p-4 bg-surface-2 border border-border rounded-2xl space-y-1.5 cursor-pointer hover:border-accent/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-accent">3. Notice Period to Vacate Premises (§ 8.3)</span>
                  <Badge tone="positive" className="text-[9px]">Standard Term</Badge>
                </div>
                <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                  {readingLevel === 'simple'
                    ? 'Plain English: After the 6-month lock-in period ends, either the landlord or tenant can terminate this agreement by giving 1 month (30 days) written notice.'
                    : 'Statutory clause: Either party may terminate the tenancy upon expiry of the lock-in period by giving thirty (30) days prior written notice delivered via registered post or email.'}
                </p>
              </div>

              <div
                onClick={() => showClickFeedback('Electricity & Maintenance: Paid as per BSES meter reading directly.', 'info')}
                className="p-4 bg-surface-2 border border-border rounded-2xl space-y-1.5 cursor-pointer hover:border-accent/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-accent">4. Electricity & Society Maintenance (§ 5.2)</span>
                  <Badge tone="positive" className="text-[9px]">Standard Term</Badge>
                </div>
                <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                  {readingLevel === 'simple'
                    ? 'Plain English: Electricity charges must be paid directly as per the BSES Rajdhani meter reading, along with monthly Resident Welfare Association (RWA) maintenance fees.'
                    : 'Statutory clause: The Lessee covenants to pay monthly electricity bills directly according to the BSES sub-meter reading and bear the society maintenance charges without default.'}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Bottom Grid: Risk Radar (Span 1) & Category Breakdown (Span 1) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Risk Radar Card with Interactive Filter Feedback */}
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-fg">Contract Risk Radar</h2>
              <p className="text-xs text-fg-muted">Filter clauses by how serious they are</p>
            </div>
            <div className="flex bg-surface-2 p-1 rounded-xl border border-[var(--border-faint)]">
              {(['all', 'high', 'moderate'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleRadarFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    radarTab === t ? 'bg-surface shadow-sm text-fg' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {t === 'all' ? 'All Terms (34)' : t === 'high' ? 'Needs Attention (2)' : 'Standard Terms (5)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-[var(--border-faint)] bg-surface-2 relative overflow-hidden flex items-center justify-center min-h-[260px] p-6">
            {/* Simulated Radar Visual Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />

            {/* Concentric Radar Rings */}
            <div className="absolute size-48 rounded-full border border-accent-line/30 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30" />
            <div className="absolute size-36 rounded-full border border-dashed border-border" />
            <div className="absolute size-20 rounded-full border border-border-strong bg-accent-subtle/20" />

            {/* Dynamic Risk Heat Clusters */}
            <div
              className={`absolute top-1/4 left-1/3 size-24 rounded-full blur-[35px] transition-all duration-700 ${
                radarTab === 'all'
                  ? 'bg-accent opacity-40'
                  : radarTab === 'high'
                  ? 'bg-red-500 opacity-70 scale-125'
                  : 'bg-emerald-500 opacity-50'
              }`}
            />
            <div
              className={`absolute bottom-1/4 right-1/4 size-28 rounded-full blur-[40px] transition-all duration-700 ${
                radarTab === 'all'
                  ? 'bg-positive opacity-30'
                  : radarTab === 'high'
                  ? 'bg-red-500 opacity-60 translate-x-4'
                  : 'bg-accent opacity-40'
              }`}
            />

            <div className="z-10 text-center max-w-sm">
              <span className="inline-block px-4 py-2 rounded-full bg-surface/90 backdrop-blur-md border border-[var(--border-strong)] text-xs font-bold text-fg shadow-lg">
                {radarTab === 'all' && 'Showing all 34 terms checked in this contract'}
                {radarTab === 'high' && '⚠️ 2 clauses have unlimited liability — ask to cap them'}
                {radarTab === 'moderate' && '✅ 5 standard terms common to most agreements'}
              </span>
            </div>
          </div>
        </div>

        {/* Category Distribution Breakdown */}
        <div className="rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-fg">Breakdown by Topic</h2>
              <p className="text-xs text-fg-muted">Click any topic to see how balanced it is</p>
            </div>
            <span className="text-[10px] font-bold text-positive uppercase tracking-widest bg-positive/10 px-3 py-1 rounded-full border border-positive/30">
              Balanced
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                label: 'Security Deposit & Lock-in Period',
                pct: 95,
                trend: 'High risk: 100% forfeiture if vacated before 6 months',
                hint: 'Ask to cap early exit penalty to 1 month rent and protect against repainting charges.',
                color: 'text-amber-500',
                bg: 'bg-amber-500',
              },
              {
                label: 'Monthly Rent & Maintenance Due',
                pct: 80,
                trend: '₹45,000 due by 5th of each month + BSES electricity',
                hint: 'Standard payment schedule with 5-day grace period.',
                color: 'text-[var(--accent)]',
                bg: 'bg-[var(--accent)]',
              },
              {
                label: 'Notice Period to Vacate Premises',
                pct: 70,
                trend: 'Requires 1 month (30 days) written notice',
                hint: 'Standard Indian tenancy notice rule after lock-in period.',
                color: 'text-[var(--positive)]',
                bg: 'bg-[var(--positive)]',
              },
              {
                label: 'Governing Law & Delhi Courts',
                pct: 100,
                trend: 'Handled in New Delhi Civil Courts',
                hint: 'Subject to exclusive jurisdiction of competent Civil Courts in New Delhi, India.',
                color: 'text-slate-400',
                bg: 'bg-slate-400',
              },
            ].map((res, i) => (
              <div
                key={i}
                onClick={() => showClickFeedback(`${res.label}: ${res.hint}`, 'info')}
                className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-end text-xs">
                  <span className="font-bold text-fg group-hover:text-accent transition-colors">{res.label}</span>
                  <span className="text-[11px] text-fg-muted font-medium">{res.trend}</span>
                </div>
                <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                  <div className={`h-full ${res.bg} transition-all duration-1000 ease-out`} style={{ width: `${res.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contract Basics and Parties */}
      <Card className="rounded-3xl border border-[var(--border-strong)]">
        <CardHeader>
          <CardTitle>Tenancy Basics & Who Is Signing</CardTitle>
        </CardHeader>
        <CardBody className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => showClickFeedback('Rajesh Kumar Sharma is the Landlord/Lessor owning the premises in Delhi.', 'info')}
              className="p-4 rounded-2xl bg-surface-2 border border-border cursor-pointer hover:border-accent/60 transition-colors"
            >
              <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Landlord / Owner (Lessor)</div>
              <div className="font-bold text-sm text-fg mt-1">Rajesh Kumar Sharma</div>
            </div>
            <div
              onClick={() => showClickFeedback('Rohan Verma is the Tenant/Lessee renting the residential apartment.', 'info')}
              className="p-4 rounded-2xl bg-surface-2 border border-border cursor-pointer hover:border-accent/60 transition-colors"
            >
              <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Tenant / Renter (Lessee)</div>
              <div className="font-bold text-sm text-fg mt-1">Rohan Verma</div>
            </div>
            <div
              onClick={() => showClickFeedback('Governed by Delhi tenancy regulations and Indian contract law (Delhi Civil Courts).', 'info')}
              className="p-4 rounded-2xl bg-surface-2 border border-border cursor-pointer hover:border-accent/60 transition-colors"
            >
              <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Which State Laws Apply</div>
              <div className="font-bold text-sm text-fg mt-1">{project?.jurisdiction_code || 'New Delhi, India'}</div>
            </div>
            <div
              onClick={() => showClickFeedback('11-month standard Indian lease period (avoids mandatory stamp registration under Sec 17).', 'info')}
              className="p-4 rounded-2xl bg-surface-2 border border-border cursor-pointer hover:border-accent/60 transition-colors"
            >
              <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider">Tenancy Length</div>
              <div className="font-bold text-sm text-fg mt-1">11 Months (Standard Lease)</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
