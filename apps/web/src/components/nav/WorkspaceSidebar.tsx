"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Calendar,
  MessageSquare,
  GitCompare,
  Briefcase,
  Home,
  BookOpen,
  Shield,
  Code2,
  Scale,
  SquareArrowOutUpRight,
  Upload,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { WorkspaceTab } from "@/app/workspace/page";
import { cn } from "@/utils/cn";

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  documentName?: string;
  onOpenUpload?: () => void;
  onOpenSettings?: () => void;
}

export function WorkspaceSidebar({
  activeTab,
  onTabChange,
  documentName = "Delhi_Residential_Rent_Agreement_11Months.pdf",
  onOpenUpload,
  onOpenSettings,
}: WorkspaceSidebarProps) {
  const analysisItems = [
    { id: "overview" as WorkspaceTab, label: "Overview & Summary", icon: LayoutDashboard },
    { id: "clauses" as WorkspaceTab, label: "Contract Clauses", icon: FileText, count: 8 },
    { id: "review_points" as WorkspaceTab, label: "Points to Check", icon: AlertTriangle, count: 6 },
    { id: "dates" as WorkspaceTab, label: "Timeline & Dates", icon: Calendar, count: 5 },
    { id: "ask_ai" as WorkspaceTab, label: "AI Assistant", icon: MessageSquare },
    { id: "compare" as WorkspaceTab, label: "Version Compare", icon: GitCompare },
    { id: "lawyer_prep" as WorkspaceTab, label: "Lawyer Briefing", icon: Briefcase },
  ];

  const secondaryItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "How It Works", href: "/how-it-works", icon: BookOpen },
    { label: "Privacy & Data", href: "/privacy", icon: Shield },
    { label: "Developer", href: "/developer", icon: Code2 },
  ];

  return (
    <>
      {/* Spacer to hold layout space without causing shift on hover */}
      <div className="hidden h-screen shrink-0 transition-[width] duration-300 md:block w-20" />

      {/* Actual visual sidebar with animated hover expand */}
      <aside
        className="group fixed top-0 left-0 hidden h-screen border-r border-[var(--border)] bg-surface-2 transition-all duration-300 md:block z-40 overflow-hidden w-20 hover:w-64 hover:shadow-2xl"
      >
        <div className="relative flex h-full flex-col w-64">
          {/* Subtle ambient glow behind the sidebar */}
          <div className="absolute top-0 -left-20 -z-10 h-64 w-64 rounded-full bg-[var(--accent-subtle)] blur-[100px] pointer-events-none opacity-40" />

          {/* Header with Logo */}
          <div className="flex h-[72px] shrink-0 items-center justify-between px-6 border-b border-[var(--border-faint)]">
            <div className="flex w-auto items-center">
              <Link
                href="/"
                className="inline-flex items-center gap-3 font-semibold"
                aria-label="ClauseIQX — home"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-subtle)] shadow-sm"
                >
                  <Scale className="size-4.5 text-[var(--accent)]" />
                </span>
                <span className="text-fg tracking-tight font-black transition-opacity duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap text-base">
                  ClauseIQ<span className="text-[var(--accent)]">X</span>
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-1 transition-opacity duration-300 absolute right-4 opacity-0 group-hover:opacity-100">
              <ThemeToggle />
            </div>
          </div>

          {/* Active Target Document Card (revealed on hover) */}
          <div className="px-4 py-3 border-b border-[var(--border-faint)] transition-all duration-300 opacity-0 group-hover:opacity-100">
            <div className="p-2.5 rounded-xl border border-[var(--border)] bg-surface/80">
              <div className="flex items-center justify-between text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1">
                <span>Active Target</span>
                <span className="text-positive font-extrabold">98% OCR</span>
              </div>
              <div className="text-xs font-bold text-fg truncate" title={documentName}>
                {documentName}
              </div>
              {onOpenUpload && (
                <button
                  onClick={onOpenUpload}
                  type="button"
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-accent hover:text-accent-strong bg-accent-subtle/50 hover:bg-accent-subtle rounded-md border border-accent-line transition-colors"
                >
                  <Upload className="size-3" />
                  Upload New Version
                </button>
              )}
            </div>
          </div>

          {/* Primary Navigation List */}
          <nav aria-label="Workspace document analysis navigation" className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-fg-subtle drop-shadow-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  Document Analysis
                </h3>
                <ul className="flex flex-col gap-1.5 p-0 m-0 list-none">
                  {analysisItems.map((item) => {
                    const active = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          id={`sidebar-tab-${item.id}`}
                          onClick={() => onTabChange(item.id)}
                          className={cn(
                            "group/link relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm transition-all w-full text-left",
                            active
                              ? "bg-gradient-to-r from-[var(--accent-subtle)] to-transparent font-bold text-fg shadow-sm"
                              : "font-medium text-fg-muted hover:bg-surface-3 hover:text-fg",
                          )}
                        >
                          <div className={cn(
                            "size-7 shrink-0 flex items-center justify-center rounded-lg transition-all",
                            active
                              ? "bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-line)]"
                              : "text-fg-subtle group-hover/link:text-fg"
                          )}>
                            <Icon className="size-4 shrink-0" />
                          </div>

                          <span className="transition-opacity duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 font-bold">
                            {item.label}
                          </span>

                          {item.count !== undefined && (
                            <span
                              className={cn(
                                "ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                                active
                                  ? "bg-[var(--accent)] text-white"
                                  : "bg-surface-3 text-fg-muted border border-[var(--border)]"
                              )}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h3 className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-fg-subtle drop-shadow-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  Navigation & Resources
                </h3>
                <ul className="flex flex-col gap-1 p-0 m-0 list-none">
                  {secondaryItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="group/link flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium text-fg-muted transition-all hover:bg-surface-3 hover:text-fg"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-3 border border-[var(--border)] group-hover/link:text-[var(--accent)] group-hover/link:border-[var(--accent)] transition-colors shadow-sm">
                            <Icon className="size-3.5 transition-transform group-hover/link:scale-110" />
                          </span>
                          <span className="transition-opacity duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100">
                            {item.label}
                          </span>
                          <SquareArrowOutUpRight className="ml-auto size-3 text-fg-subtle transition-all group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:text-[var(--accent)] opacity-0 group-hover:opacity-100" />
                        </Link>
                      </li>
                    );
                  })}
                  {onOpenSettings && (
                    <li>
                      <button
                        type="button"
                        onClick={onOpenSettings}
                        className="group/link flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-bold text-accent transition-all hover:bg-surface-3 w-full text-left"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent-subtle border border-accent-line text-accent transition-colors shadow-sm">
                          <Settings className="size-3.5 transition-transform group-hover/link:rotate-90" />
                        </span>
                        <span className="transition-opacity duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100">
                          Workspace Settings
                        </span>
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
