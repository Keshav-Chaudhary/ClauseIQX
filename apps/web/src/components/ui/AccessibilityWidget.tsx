"use client";

import React, { useState, useEffect, useRef } from "react";
import { Accessibility, X, Type, Eye, Check } from "lucide-react";

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Alt + A shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    if (next) {
      document.documentElement.classList.add("large-text");
    } else {
      document.documentElement.classList.remove("large-text");
    }
  };

  const toggleDyslexicFont = () => {
    const next = !dyslexicFont;
    setDyslexicFont(next);
    if (next) {
      document.documentElement.classList.add("dyslexic-font");
    } else {
      document.documentElement.classList.remove("dyslexic-font");
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-6 z-50 flex flex-col items-start">
      {/* Settings Dialog Panel */}
      {isOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-panel-title"
          className="mb-3 w-[calc(100vw-48px)] sm:w-80 rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-faint)] pb-3 mb-4">
            <h2 id="a11y-panel-title" className="text-sm font-bold text-fg flex items-center gap-2">
              <Accessibility className="size-4 text-[var(--accent)]" />
              Accessibility Tools
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility panel"
              className="rounded-lg p-1 text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* High Contrast */}
            <button
              onClick={toggleHighContrast}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                highContrast
                  ? "bg-accent-subtle text-accent border-accent-line"
                  : "bg-surface-2 text-fg border-border hover:bg-surface-3"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Eye className="size-4" />
                <span>High Contrast Mode</span>
              </div>
              {highContrast && <Check className="size-4" />}
            </button>

            {/* Large Text */}
            <button
              onClick={toggleLargeText}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                largeText
                  ? "bg-accent-subtle text-accent border-accent-line"
                  : "bg-surface-2 text-fg border-border hover:bg-surface-3"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="size-4" />
                <span>Enlarged Text (120%)</span>
              </div>
              {largeText && <Check className="size-4" />}
            </button>

            {/* Dyslexic Friendly */}
            <button
              onClick={toggleDyslexicFont}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                dyslexicFont
                  ? "bg-accent-subtle text-accent border-accent-line"
                  : "bg-surface-2 text-fg border-border hover:bg-surface-3"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="size-4" />
                <span>Legible Dyslexia Font</span>
              </div>
              {dyslexicFont && <Check className="size-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open accessibility options (Alt+A)"
        aria-expanded={isOpen}
        className="flex size-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-surface text-fg-muted shadow-xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all hover:scale-105 active:scale-95"
      >
        <Accessibility className="size-5" />
      </button>
    </div>
  );
}
