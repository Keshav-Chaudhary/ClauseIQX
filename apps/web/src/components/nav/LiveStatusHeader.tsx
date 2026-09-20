"use client";

import React from "react";
import { FileText, MapPin, Layers, Upload, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LiveStatusHeaderProps {
  documentName?: string;
  jurisdiction?: string;
  ocrConfidence?: number;
  status?: string;
  onOpenUpload?: () => void;
  onOpenExport?: () => void;
  onOpenSettings?: () => void;
}

export function LiveStatusHeader({
  documentName = "Delhi_Residential_Rent_Agreement_11Months.pdf",
  jurisdiction = "New Delhi, India",
  ocrConfidence = 0.98,
  status = "READY",
  onOpenUpload,
  onOpenExport,
  onOpenSettings,
}: LiveStatusHeaderProps) {
  return (
    <div className="w-full bg-surface-2 border-b border-[var(--border-strong)] py-2.5 px-4 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 shrink-0">
      {/* Left: Live Analysis Status */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
            Live
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[var(--accent)]" />
            <span className="text-sm font-bold text-fg truncate max-w-[200px] lg:max-w-xs" title={documentName}>
              {documentName}
            </span>
          </div>
          <div className="px-2.5 py-0.5 bg-surface-3 border border-[var(--border-strong)] rounded-md text-xs font-black text-[var(--accent)] shadow-inner">
            {status} · {(ocrConfidence * 100).toFixed(0)}% OCR
          </div>
        </div>

        <div className="hidden sm:block w-px h-5 bg-[var(--border-faint)]" />

        {/* Context metadata */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-fg-muted">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-fg-subtle" />
            <span>{jurisdiction}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5 text-fg-subtle" />
            <span>Passage Grounded</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
        {onOpenSettings && (
          <Button
            variant="outline"
            onClick={onOpenSettings}
            className="text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Workspace & Account Settings"
          >
            <Settings className="size-3.5 text-accent" />
            <span>Settings</span>
          </Button>
        )}
        {onOpenUpload && (
          <Button
            variant="outline"
            onClick={onOpenUpload}
            className="text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Upload className="size-3.5" />
            <span>Upload New</span>
          </Button>
        )}
        {onOpenExport && (
          <Button
            variant="primary"
            onClick={onOpenExport}
            className="text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Export Package</span>
          </Button>
        )}
      </div>
    </div>
  );
}
