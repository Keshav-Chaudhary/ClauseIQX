"use client";

import React from "react";
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  Calendar,
  MessageSquare,
  GitCompare,
  Briefcase,
} from "lucide-react";
import { WorkspaceTab } from "@/app/workspace/page";

interface WorkspaceMobileNavProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
}

const MOBILE_TABS = [
  { id: "overview" as WorkspaceTab, label: "Overview", icon: LayoutDashboard },
  { id: "clauses" as WorkspaceTab, label: "Clauses", icon: FileText, count: 8 },
  { id: "review_points" as WorkspaceTab, label: "Points", icon: AlertCircle, count: 6 },
  { id: "dates" as WorkspaceTab, label: "Dates", icon: Calendar, count: 5 },
  { id: "ask_ai" as WorkspaceTab, label: "Ask AI", icon: MessageSquare },
  { id: "compare" as WorkspaceTab, label: "Compare", icon: GitCompare },
  { id: "lawyer_prep" as WorkspaceTab, label: "Briefing", icon: Briefcase },
];

export function WorkspaceMobileNav({
  activeTab,
  onTabChange,
}: WorkspaceMobileNavProps) {
  return (
    <nav
      aria-label="Workspace mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-surface/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden p-0 m-0 list-none">
        {MOBILE_TABS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <li key={item.id} className="flex-1 min-w-[58px] snap-start">
              <button
                type="button"
                id={`mobile-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
                  isActive ? "text-[var(--accent)] font-bold" : "text-fg-muted hover:text-fg"
                }`}
              >
                <div className="relative">
                  <Icon className="size-4.5" />
                  {item.count !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 text-[8px] font-bold rounded-full bg-accent text-accent-fg leading-none py-0.5">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
