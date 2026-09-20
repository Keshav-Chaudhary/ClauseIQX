"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, ArrowRight } from "lucide-react";
import { ThemeToggle } from "./ui/ThemeToggle";

export function GlobalHeader() {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace") || pathname.startsWith("/app");

  // In the workspace, the left sidebar handles navigation
  if (isWorkspace) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/developer", label: "Developer" },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-[var(--border)] bg-surface/75 px-3 py-2 sm:px-5 sm:py-2.5 shadow-[var(--shadow-md)] backdrop-blur-md transition-all hover:border-[var(--accent-line)] hover:bg-surface/85">
        
        {/* Left: Brand Logo & Navigation Pills */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 no-underline font-semibold"
            aria-label="ClauseIQX home"
          >
            <span
              aria-hidden="true"
              className="flex size-7 sm:size-8 items-center justify-center rounded-full border border-[var(--accent-line)] bg-[var(--accent-subtle)] text-[var(--accent)] shadow-sm"
            >
              <Scale className="size-4 text-[var(--accent)]" />
            </span>
            <span className="font-black text-base sm:text-lg text-fg tracking-tight">
              ClauseIQ<span className="text-[var(--accent)]">X</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-1.5">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? "bg-accent text-white shadow-sm"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Theme Toggle & Launch Workspace CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/workspace"
            className="group flex h-9 sm:h-10 items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-[var(--accent)] px-3.5 sm:px-5 text-xs sm:text-sm font-bold text-[var(--accent-fg)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] hover:shadow-[0_0_16px_var(--accent-line)] whitespace-nowrap"
          >
            <span className="hidden sm:inline">Launch Workspace</span>
            <span className="sm:hidden">Launch</span>
            <ArrowRight aria-hidden="true" className="size-3.5 sm:size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </header>
    </div>
  );
}
