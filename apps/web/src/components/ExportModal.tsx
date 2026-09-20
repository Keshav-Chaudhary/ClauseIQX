'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Scale,
  FileCode,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getApiBaseUrl } from '../lib/api-config';

interface ExportModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const [sourceType, setSourceType] = useState<'summary' | 'comparison' | 'lawyer_prep'>('summary');
  const [format, setFormat] = useState<'markdown' | 'pdf' | 'docx' | 'ics'>('markdown');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDownloadUrl(null);
      setError(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const token = localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token');
      if (!token) {
        throw new Error('Please sign in before generating an export.');
      }
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/projects/${projectId}/exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exportSourceType: sourceType,
          format: format,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error?.message || `Export failed with status ${res.status}.`);
      }

      const data = await res.json();
      if (typeof data.download_url !== 'string' || data.download_url.length === 0) {
        throw new Error('The export service did not return a download link.');
      }
      setDownloadUrl(data.download_url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate the export.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[var(--accent)] opacity-15 blur-[60px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="export-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-fg">
                Export Document Package
              </h2>
              <Badge tone="positive" className="text-[10px] font-bold uppercase">
                Grounded Brief
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-fg-muted mt-1">
              Download clean, plain-English summaries, timelines, or lawyer briefs.
            </p>
          </div>
          <button
            type="button"
            className="size-8 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-fg-muted hover:text-fg transition-colors shrink-0"
            onClick={onClose}
            aria-label="Close export modal"
            disabled={isGenerating}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Legal Disclaimer & Stamp Notice */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-2 border border-border text-xs text-fg-muted">
          <div className="size-8 rounded-xl bg-accent-subtle border border-accent-line flex items-center justify-center text-accent shrink-0">
            <Scale className="size-4" />
          </div>
          <div className="leading-relaxed">
            <strong className="text-fg font-semibold">Verified Citations Included:</strong> All exports contain verbatim paragraph citations and timestamps. Download links remain active for 1 hour.
          </div>
        </div>

        {/* Source Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-fg-subtle uppercase tracking-wider block">
            Select Export Content
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'summary', label: 'Summary & Analysis', icon: FileText },
              { id: 'comparison', label: 'Comparison Diff', icon: FileCode },
              { id: 'lawyer_prep', label: 'Lawyer Briefing', icon: Scale },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSourceType(s.id as 'summary' | 'comparison' | 'lawyer_prep')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    sourceType === s.id
                      ? 'border-accent bg-accent-subtle text-accent shadow-sm'
                      : 'border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-accent/40'
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="text-[11px] text-center">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-fg-subtle uppercase tracking-wider block">
            Select File Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'markdown', label: 'Markdown', ext: '.md' },
              { id: 'pdf', label: 'PDF Document', ext: '.pdf' },
              { id: 'docx', label: 'Word Document', ext: '.docx' },
              { id: 'ics', label: 'Calendar File', ext: '.ics' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id as 'markdown' | 'pdf' | 'docx' | 'ics')}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  format === f.id
                    ? 'border-accent bg-accent-subtle text-accent shadow-sm'
                    : 'border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-accent/40'
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[10px] text-fg-subtle font-mono">{f.ext}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ready to Download Box */}
        {downloadUrl && (
          <div className="p-4 rounded-2xl bg-positive/10 border border-positive/30 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-positive shrink-0" />
              <div>
                <div className="font-bold text-xs text-fg">Package Ready!</div>
                <div className="text-[11px] text-fg-muted">Click to save to your device</div>
              </div>
            </div>
            <a
              href={downloadUrl}
              download={`ClauseIQX_${sourceType}_${projectName.replace(/\s+/g, '_')}.${format}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-positive text-surface font-bold text-xs hover:bg-positive/90 transition-colors shadow-sm"
            >
              <Download className="size-3.5" />
              Save {format.toUpperCase()}
            </a>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isGenerating}
            className="text-xs"
          >
            Close
          </Button>
          <Button
            variant="primary"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="text-xs gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Generating Package...
              </>
            ) : (
              <>
                <Download className="size-3.5" />
                Generate Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
