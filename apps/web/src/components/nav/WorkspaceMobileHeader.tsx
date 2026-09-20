"use client";

import React from "react";
import Link from "next/link";
import { Scale, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface WorkspaceMobileHeaderProps {
  documentName?: string;
  onOpenUpload?: () => void;
}

export function WorkspaceMobileHeader({
  documentName = "Delhi_Residential_Rent_Agreement_11Months.pdf",
  onOpenUpload,
}: WorkspaceMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[var(--border)] bg-surface/95 px-4 backdrop-blur-md md:hidden">
      <Link href="/" className="flex items-center gap-2 font-bold text-sm text-fg">
        <span className="flex size-7 items-center justify-center rounded-md border border-[var(--accent-line)] bg-[var(--accent-subtle)] text-[var(--accent)] font-bold text-xs shrink-0">
          <Scale className="size-3.5" />
        </span>
        <div className="flex flex-col min-w-0">
          <span className="truncate text-xs font-bold leading-tight">ClauseIQX</span>
          <span className="truncate text-[10px] text-fg-muted font-normal max-w-[120px]">{documentName}</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-accent-line bg-accent-subtle text-accent"
          >
            <Upload className="size-3" />
            <span>Upload</span>
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
