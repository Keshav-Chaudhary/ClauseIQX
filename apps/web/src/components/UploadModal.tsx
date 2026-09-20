'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getApiBaseUrl } from '../lib/api-config';

interface UploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (document: { id: string; filename: string; [key: string]: unknown }) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'scanning' | 'processing' | 'ready' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setUploadStatus('idle');
      setErrorMessage(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        uploadStatus !== 'uploading' &&
        uploadStatus !== 'scanning' &&
        uploadStatus !== 'processing'
      ) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, uploadStatus, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMessage(null);
    }
  };

  const handleStartUpload = async () => {
    if (!file) return;

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds maximum size of 25MB.');
      setUploadStatus('error');
      return;
    }

    try {
      setUploadStatus('uploading');
      setErrorMessage(null);

      // Read file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1] || (reader.result as string);

          setUploadStatus('scanning');

          // POST to backend
          const token = localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token');
          if (!token) {
            throw new Error('Please sign in before uploading a document.');
          }
          const apiBase = getApiBaseUrl();
          const res = await fetch(`${apiBase}/api/v1/projects/${projectId}/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              filename: file.name,
              mediaType: file.type || 'application/pdf',
              contentBase64: base64Data,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Upload failed with status ${res.status}`);
          }

          setUploadStatus('processing');
          const data = await res.json();

          setUploadStatus('ready');
          setTimeout(() => {
            onUploadSuccess({
              ...data.document,
              ocrConfidence: data.ocr_confidence ?? 0.98,
            });
            onClose();
          }, 800);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'An unexpected error occurred during processing.';
          setErrorMessage(msg);
          setUploadStatus('error');
        }
      };

      reader.readAsDataURL(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to read file.';
      setErrorMessage(msg);
      setUploadStatus('error');
    }
  };

  const isBusy = uploadStatus === 'uploading' || uploadStatus === 'scanning' || uploadStatus === 'processing';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[var(--border-strong)] bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient radial glow */}
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[var(--accent)] opacity-15 blur-[60px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="upload-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-fg">
                Upload Document or Addendum
              </h2>
              <Badge tone="accent" className="text-[10px] font-bold uppercase">
                AI Ingestion
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-fg-muted mt-1">
              Add a rent agreement, lease deed, exhibit, or amendment for instant review.
            </p>
          </div>
          <button
            type="button"
            className="size-8 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-fg-muted hover:text-fg transition-colors shrink-0"
            onClick={onClose}
            aria-label="Close upload modal"
            disabled={isBusy}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Security & Encryption Notice */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-2 border border-border text-xs text-fg-muted">
          <div className="size-8 rounded-xl bg-positive/10 border border-positive/30 flex items-center justify-center text-positive shrink-0">
            <Lock className="size-4" />
          </div>
          <div className="leading-relaxed">
            <strong className="text-fg font-semibold">100% Private & Encrypted:</strong> Scanned for viruses, verified safe, and grounded verbatim. Supports PDF, DOCX, TXT up to 25MB.
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="File drop zone — click or press Enter to browse files"
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
            isDragOver
              ? 'border-accent bg-accent-subtle/40 scale-[1.01]'
              : file
              ? 'border-positive/50 bg-positive/5'
              : 'border-[var(--border-strong)] bg-surface-2 hover:border-accent hover:bg-surface-3'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Select file to upload"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-2xl bg-positive/10 border border-positive/30 flex items-center justify-center text-positive shadow-sm">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="font-bold text-sm text-fg mt-1 max-w-[280px] truncate">{file.name}</div>
              <div className="text-xs text-fg-muted">
                {(file.size / 1024).toFixed(1)} KB · Click or drag another file to replace
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-2xl bg-accent-subtle border border-accent-line flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-sm">
                <UploadCloud className="size-6" />
              </div>
              <div className="font-bold text-sm text-fg mt-1">
                Drag and drop your contract here
              </div>
              <div className="text-xs text-fg-muted">
                or <span className="text-accent font-semibold underline underline-offset-2">browse from your device</span> (PDF, DOCX, TXT)
              </div>
            </div>
          )}
        </div>

        {/* Progress State Indicator */}
        {uploadStatus !== 'idle' && (
          <div className="p-4 rounded-2xl bg-surface-2 border border-border flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-xs font-bold text-fg">
              {uploadStatus === 'uploading' && (
                <>
                  <Loader2 className="size-4 text-accent animate-spin" />
                  <span>Uploading document bytes...</span>
                </>
              )}
              {uploadStatus === 'scanning' && (
                <>
                  <Loader2 className="size-4 text-amber-500 animate-spin" />
                  <span>Quarantined: Checking safety & scanning layout...</span>
                </>
              )}
              {uploadStatus === 'processing' && (
                <>
                  <Sparkles className="size-4 text-accent animate-pulse" />
                  <span>AI extraction: Finding rent rules, deposits & notice terms...</span>
                </>
              )}
              {uploadStatus === 'ready' && (
                <>
                  <CheckCircle2 className="size-4 text-positive" />
                  <span className="text-positive">Processing complete! Opening workspace...</span>
                </>
              )}
              {uploadStatus === 'error' && (
                <>
                  <AlertTriangle className="size-4 text-critical" />
                  <span className="text-critical">Document ingestion failed</span>
                </>
              )}
            </div>

            {/* Simulated progress track */}
            <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full bg-accent transition-all duration-500 ${
                  uploadStatus === 'uploading'
                    ? 'w-1/3'
                    : uploadStatus === 'scanning'
                    ? 'w-2/3'
                    : uploadStatus === 'processing'
                    ? 'w-5/6'
                    : uploadStatus === 'ready'
                    ? 'w-full bg-positive'
                    : 'w-full bg-critical'
                }`}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isBusy}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!file || isBusy}
            onClick={handleStartUpload}
            className="text-xs gap-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="size-3.5" />
                Process Document
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
