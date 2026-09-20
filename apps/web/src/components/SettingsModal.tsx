"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Shield,
  Lock,
  Sun,
  Moon,
  CheckCircle2,
  Key,
  Sliders,
  Sparkles,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/theme/ThemeProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = "account" | "privacy" | "security" | "appearance";

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [accountForm, setAccountForm] = useState({
    fullName: "The Developer",
    email: "developer@clauseiqx.internal",
    role: "Senior Legal Counsel / Advocate",
    org: "ClauseIQX Enterprise Client",
    plan: "Enterprise Pro Unlimited",
  });

  const [privacyForm, setPrivacyForm] = useState({
    localOnly: true,
    zeroRetention: true,
    autoPurgeDays: 30,
    allowTelemetry: false,
  });

  const [securityForm] = useState({
    twoFactor: true,
    sessionTimeoutMins: 60,
    apiToken: "ciqx_live_9f83a21bc9048e712...",
  });

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-surface shadow-2xl flex flex-col md:flex-row h-[580px] max-h-[90vh]">
        {/* Modal Sidebar Tabs */}
        <div className="w-full md:w-60 bg-surface-2 border-b md:border-b-0 md:border-r border-[var(--border)] p-4 flex flex-col shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-4">
            <span className="flex size-8 items-center justify-center rounded-xl bg-accent-subtle border border-accent-line text-accent">
              <Sliders className="size-4" />
            </span>
            <div>
              <h2 id="settings-modal-title" className="text-sm font-extrabold text-fg tracking-tight">
                Workspace Settings
              </h2>
              <p className="text-[10px] text-fg-muted font-medium">ClauseIQX Preferences</p>
            </div>
          </div>

          <nav aria-label="Settings categories" className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            <button
              type="button"
              onClick={() => setActiveSection("account")}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeSection === "account"
                  ? "bg-accent text-white shadow-sm"
                  : "text-fg-muted hover:bg-surface-3 hover:text-fg"
              }`}
            >
              <User className="size-4" />
              <span>Account & Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("privacy")}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeSection === "privacy"
                  ? "bg-accent text-white shadow-sm"
                  : "text-fg-muted hover:bg-surface-3 hover:text-fg"
              }`}
            >
              <Shield className="size-4" />
              <span>Privacy & Data</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("security")}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeSection === "security"
                  ? "bg-accent text-white shadow-sm"
                  : "text-fg-muted hover:bg-surface-3 hover:text-fg"
              }`}
            >
              <Lock className="size-4" />
              <span>Security & Access</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("appearance")}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeSection === "appearance"
                  ? "bg-accent text-white shadow-sm"
                  : "text-fg-muted hover:bg-surface-3 hover:text-fg"
              }`}
            >
              <Sparkles className="size-4" />
              <span>Appearance & Theme</span>
            </button>
          </nav>

          <div className="mt-auto hidden md:block pt-4 border-t border-[var(--border-faint)] px-3">
            <div className="text-[10px] text-fg-subtle">
              ClauseIQX v2.4.0-prod
            </div>
            <div className="text-[10px] font-bold text-positive mt-0.5">
              🟢 Telemetry Encrypted
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Top Bar with Close Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-faint)]">
            <h3 className="text-base font-bold text-fg capitalize">
              {activeSection === "account" && "Account & Profile Settings"}
              {activeSection === "privacy" && "Privacy & Data Governance"}
              {activeSection === "security" && "Security & Authentication"}
              {activeSection === "appearance" && "Appearance & Display Preferences"}
            </h3>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close settings modal"
              className="size-8 flex items-center justify-center rounded-xl bg-surface-2 border border-[var(--border)] text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Section Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* 1. Account Section */}
            {activeSection === "account" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-surface-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-fg uppercase tracking-wider">Current License</h4>
                      <p className="text-sm font-black text-accent mt-0.5">{accountForm.plan}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-positive-subtle border border-positive text-[10px] font-extrabold text-positive">
                      Active · Verified
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-fg-muted mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={accountForm.fullName}
                      onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-surface-3 px-3 py-2 text-xs font-bold text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fg-muted mb-1.5">Work Email</label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-surface-3 px-3 py-2 text-xs font-bold text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fg-muted mb-1.5">Legal Title / Role</label>
                    <input
                      type="text"
                      value={accountForm.role}
                      onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-surface-3 px-3 py-2 text-xs font-bold text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fg-muted mb-1.5">Organization</label>
                    <input
                      type="text"
                      value={accountForm.org}
                      onChange={(e) => setAccountForm({ ...accountForm, org: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-surface-3 px-3 py-2 text-xs font-bold text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Privacy Section */}
            {activeSection === "privacy" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-surface-2">
                  <div>
                    <h4 className="text-xs font-bold text-fg">Local Only Data Processing</h4>
                    <p className="text-xs text-fg-muted mt-0.5">Parse documents without third-party cloud logging</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyForm.localOnly}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, localOnly: e.target.checked })}
                    className="size-4 accent-accent rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-surface-2">
                  <div>
                    <h4 className="text-xs font-bold text-fg">Zero Retention Guarantee</h4>
                    <p className="text-xs text-fg-muted mt-0.5">Delete raw extracted vectors after session close</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyForm.zeroRetention}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, zeroRetention: e.target.checked })}
                    className="size-4 accent-accent rounded"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-[var(--border)] bg-surface-2 space-y-2">
                  <h4 className="text-xs font-bold text-fg">Automated Document Purge Schedule</h4>
                  <p className="text-xs text-fg-muted">Automatically remove uploaded PDFs after set days</p>
                  <select
                    value={privacyForm.autoPurgeDays}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, autoPurgeDays: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[var(--border)] bg-surface-3 px-3 py-2 text-xs font-bold text-fg"
                  >
                    <option value={7}>Purge after 7 days</option>
                    <option value={30}>Purge after 30 days (Recommended)</option>
                    <option value={90}>Purge after 90 days</option>
                    <option value={0}>Manual purge only</option>
                  </select>
                </div>
              </div>
            )}

            {/* 3. Security Section */}
            {activeSection === "security" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-surface-2">
                  <div className="flex items-center gap-3">
                    <Key className="size-5 text-accent" />
                    <div>
                      <h4 className="text-xs font-bold text-fg">Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs text-fg-muted mt-0.5">Hardware key or authenticator app required</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-positive-subtle border border-positive text-[10px] font-extrabold text-positive">
                    Enabled
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--border)] bg-surface-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-fg">Workspace API Token</h4>
                    <span className="text-[10px] text-accent font-bold">Read / Write Access</span>
                  </div>
                  <input
                    type="password"
                    readOnly
                    value={securityForm.apiToken}
                    className="w-full rounded-xl border border-[var(--border)] bg-surface-3 px-3 py-2 text-xs font-mono text-fg"
                  />
                </div>
              </div>
            )}

            {/* 4. Appearance Section */}
            {activeSection === "appearance" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-surface-2 space-y-3">
                  <h4 className="text-xs font-bold text-fg">Interface Theme</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                        theme === "dark"
                          ? "border-accent bg-accent-subtle text-accent shadow-sm"
                          : "border-[var(--border)] bg-surface text-fg-muted hover:text-fg"
                      }`}
                    >
                      <Moon className="size-4" />
                      <span>Legal Dark Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                        theme === "light"
                          ? "border-accent bg-accent-subtle text-accent shadow-sm"
                          : "border-[var(--border)] bg-surface text-fg-muted hover:text-fg"
                      }`}
                    >
                      <Sun className="size-4" />
                      <span>Legal Light Mode</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--border)] bg-surface-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-fg">Density Mode</h4>
                    <p className="text-xs text-fg-muted mt-0.5">High-density layout for multi-clause comparisons</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-3 border border-[var(--border)] text-[10px] font-bold text-fg">
                    Compact
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save Bar */}
          <div className="px-6 py-4 border-t border-[var(--border-faint)] bg-surface-2 flex items-center justify-between">
            {isSaved ? (
              <div className="flex items-center gap-2 text-xs font-bold text-positive animate-in fade-in">
                <CheckCircle2 className="size-4" />
                <span>Settings saved successfully!</span>
              </div>
            ) : (
              <span className="text-xs text-fg-subtle">
                All changes apply immediately to your active session.
              </span>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} className="text-xs gap-1.5">
                <Save className="size-3.5" />
                <span>Save Preferences</span>
              </Button>
            </div>
          </div>

          {/* Legal Information Notice Footer */}
          <div className="px-6 py-3 border-t border-[var(--border-faint)] bg-surface-3/40 flex items-start gap-2.5">
            <span aria-hidden="true" className="text-base shrink-0">⚖️</span>
            <div>
              <span className="text-[10px] font-bold text-fg uppercase tracking-wider block">
                Legal Information Notice
              </span>
              <p className="text-[11px] text-fg-muted mt-0.5 leading-relaxed">
                ClauseIQX provides automated document analysis and clause extraction grounded directly in your uploaded file. This tool does not provide legal advice, representation, or outcome predictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
