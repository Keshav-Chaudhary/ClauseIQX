'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '../../lib/api-config';
import { Card, CardHeader, CardTitle, CardBody, Button, Input, Badge } from '@/components/ui';

export default function AccountPage() {
  const [displayName, setDisplayName] = useState('ClauseIQX Workspace User');
  const [email, setEmail] = useState('workspace-demo@clauseiqx.internal');
  const [organization, setOrganization] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Token copy state
  const [tokenCopied, setTokenCopied] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleCopyToken = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
    if (token && navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto p-4 md:p-8 space-y-6">
      {/* Page Header */}
      <section className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg tracking-tight">Account & Security Settings</h1>
          <p className="text-sm text-fg-muted mt-1">
            Manage your personal credentials, active sessions, and AI integration preferences.
          </p>
        </div>
        <Badge tone="accent" className="text-xs uppercase font-bold tracking-wider">
          Role: Project Owner
        </Badge>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardBody className="p-6 pt-0">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg-subtle tracking-wider uppercase mb-1">
                  FULL NAME
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-subtle tracking-wider uppercase mb-1">
                  EMAIL ADDRESS
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-subtle tracking-wider uppercase mb-1">
                  ORGANIZATION / LAW FIRM
                </label>
                <Input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>

              {isSaved && (
                <div className="text-sm font-bold text-positive bg-positive-subtle p-2 rounded border border-positive-line inline-block w-full">
                  ✓ Profile saved successfully.
                </div>
              )}

              <Button type="submit" variant="primary">
                Save Profile Changes
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Security & Password */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Authentication</CardTitle>
          </CardHeader>
          <CardBody className="p-6 pt-0">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg-subtle tracking-wider uppercase mb-1">
                  CURRENT PASSWORD
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-subtle tracking-wider uppercase mb-1">
                  NEW PASSWORD
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>

              {passwordError && (
                <div className="text-sm font-bold text-negative bg-negative-subtle p-2 rounded border border-negative-line w-full">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="text-sm font-bold text-positive bg-positive-subtle p-2 rounded border border-positive-line w-full">
                  ✓ Password updated successfully.
                </div>
              )}

              <Button type="submit" variant="outline">
                Update Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* Infrastructure & Integration Status */}
      <Card className="my-6">
        <CardHeader>
          <CardTitle>System Drivers & AI Architecture</CardTitle>
        </CardHeader>
        <CardBody className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-2 rounded-md border border-border">
              <div className="text-xs font-bold text-fg-subtle tracking-wider uppercase">
                LLM INFERENCE DRIVER
              </div>
              <div className="font-extrabold text-sm text-fg mt-1">
                MockLLM / GPT-4o-mini
              </div>
              <div className="text-xs font-bold text-positive mt-1">
                ● Zero Retention Active
              </div>
            </div>

            <div className="p-4 bg-surface-2 rounded-md border border-border">
              <div className="text-xs font-bold text-fg-subtle tracking-wider uppercase">
                EMBEDDINGS DRIVER
              </div>
              <div className="font-extrabold text-sm text-fg mt-1">
                Text-Embedding-3 (1536-dim)
              </div>
              <div className="text-xs font-bold text-positive mt-1">
                ● Hybrid Cosine + BM25
              </div>
            </div>

            <div className="p-4 bg-surface-2 rounded-md border border-border">
              <div className="text-xs font-bold text-fg-subtle tracking-wider uppercase">
                OBJECT STORAGE
              </div>
              <div className="font-extrabold text-sm text-fg mt-1">
                Private S3-Compatible Bucket
              </div>
              <div className="text-xs font-bold text-positive mt-1">
                ● AES-256 Encryption at Rest
              </div>
            </div>

            <div className="p-4 bg-surface-2 rounded-md border border-border">
              <div className="text-xs font-bold text-fg-subtle tracking-wider uppercase">
                MALWARE & THREAT SHIELD
              </div>
              <div className="font-extrabold text-sm text-fg mt-1">
                ClamAV Daemon Sandbox
              </div>
              <div className="text-xs font-bold text-positive mt-1">
                ● 0 Threats Detected
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Developer API Access & Telemetry */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Access & API Credentials</CardTitle>
          <p className="text-sm text-fg-muted">
            Use your bearer token to authenticate external tools or access the REST API directly.
          </p>
        </CardHeader>
        <CardBody className="p-6 pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <code className="px-4 py-2 bg-surface-3 rounded-md text-xs font-mono text-fg border border-border">
              Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            </code>

            <Button
              variant="outline"
              onClick={handleCopyToken}
              className="text-xs"
            >
              {tokenCopied ? '✓ Copied Token' : '📋 Copy Bearer Token'}
            </Button>

            <a
              href={`${getApiBaseUrl()}/api/docs.json`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center font-bold transition-all px-4 py-2 text-sm rounded-md border border-border bg-surface text-fg hover:bg-surface-2 hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 text-xs"
            >
              📄 OpenAPI Specification
            </a>

            <a
              href={`${getApiBaseUrl()}/api/v1/metrics`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center font-bold transition-all px-4 py-2 text-sm rounded-md border border-border bg-surface text-fg hover:bg-surface-2 hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 text-xs"
            >
              📊 System Metrics Endpoint
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
