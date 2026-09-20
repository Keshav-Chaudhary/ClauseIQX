'use client';

import { useState, useEffect } from 'react';
import { ContractControlCenterTab, AnalysisOverview } from '../../components/tabs/ContractControlCenterTab';
import { ClausesTab } from '../../components/tabs/ClausesTab';
import { ReviewPointsTab } from '../../components/tabs/ReviewPointsTab';
import { KeyDatesTab } from '../../components/tabs/KeyDatesTab';
import { AskAiTab } from '../../components/tabs/AskAiTab';
import { CompareTab } from '../../components/tabs/CompareTab';
import { LawyerPrepTab } from '../../components/tabs/LawyerPrepTab';
import { UploadModal } from '../../components/UploadModal';
import { ExportModal } from '../../components/ExportModal';
import { SettingsModal } from '../../components/SettingsModal';
import { getApiBaseUrl } from '../../lib/api-config';
import { WorkspaceSidebar } from '../../components/nav/WorkspaceSidebar';
import { WorkspaceMobileHeader } from '../../components/nav/WorkspaceMobileHeader';
import { WorkspaceMobileNav } from '../../components/nav/WorkspaceMobileNav';
import { LiveStatusHeader } from '../../components/nav/LiveStatusHeader';
import { AccessibilityWidget } from '../../components/ui/AccessibilityWidget';

export type WorkspaceTab =
  | 'overview'
  | 'clauses'
  | 'review_points'
  | 'dates'
  | 'ask_ai'
  | 'compare'
  | 'lawyer_prep';

interface UploadedDocPayload {
  id: string;
  filename: string;
  [key: string]: unknown;
}

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [project, setProject] = useState({
    id: 'proj_delhi_rent_agreement',
    name: 'Delhi Residential Tenancy Agreement (11 Months)',
    jurisdiction_code: 'New Delhi, India',
    document_type: 'Residential Rent Agreement',
  });

  const [document, setDocument] = useState<{
    id: string;
    filename: string;
    status: string;
    ocrConfidence?: number;
  }>({
    id: 'doc_delhi_tenancy_v1',
    filename: 'Delhi_Residential_Rent_Agreement_11Months.pdf',
    status: 'READY',
    ocrConfidence: 0.98,
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
    if (!token) return;

    const params = new URLSearchParams(window.location.search);
    const queryProjId = params.get('projectId');
    const apiBase = getApiBaseUrl();

    fetch(`${apiBase}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.projects && data.projects.length > 0) {
          const selectedProj = queryProjId
            ? data.projects.find((p: { id: string }) => p.id === queryProjId) || data.projects[0]
            : data.projects[0];

          setProject({
            id: selectedProj.id,
            name: selectedProj.name,
            jurisdiction_code: selectedProj.jurisdiction_code || 'California, US',
            document_type: selectedProj.document_type || 'Commercial Agreement',
          });

          fetch(`${apiBase}/api/v1/projects/${selectedProj.id}/documents`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((dRes) => (dRes.ok ? dRes.json() : null))
            .then((docData) => {
              if (docData?.documents && docData.documents.length > 0) {
                const latestDoc = docData.documents[docData.documents.length - 1];
                setDocument({
                  id: latestDoc.id,
                  filename: latestDoc.filename,
                  status: latestDoc.status,
                  ocrConfidence: 0.98,
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const [analysis, setAnalysis] = useState<AnalysisOverview | null>(null);
  const [readingLevel, setReadingLevel] = useState<'simple' | 'detailed'>('simple');

  const handleReadingLevelChange = async (newLevel: 'simple' | 'detailed') => {
    setReadingLevel(newLevel);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('clauseiqx_auth_token') || localStorage.getItem('clauseiqx_auth_token')) : null;
      if (!token) return;
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/projects/${project.id}/documents/${document.id}/analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          analysisType: 'summary',
          readingLevel: newLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis({
          id: data.analysis?.id,
          findings: data.findings || [],
        });
      }
    } catch {
      // Handled gracefully in client
    }
  };

  const handleDocumentUploaded = (newDoc: UploadedDocPayload) => {
    setDocument({
      id: newDoc.id,
      filename: newDoc.filename,
      status: 'READY',
      ocrConfidence: typeof newDoc.ocrConfidence === 'number' ? newDoc.ocrConfidence : 0.98,
    });
    setAnalysis(null);
    setActiveTab('overview');
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-bg text-fg relative">
      {/* Desktop Left Sidebar Navigation with Animated Hover Expand */}
      <WorkspaceSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        documentName={document.filename}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Mobile Top Header */}
      <WorkspaceMobileHeader
        documentName={document.filename}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        {/* Live Telemetry Status Header (Matching Challenge4 TournamentHeader) */}
        <LiveStatusHeader
          documentName={document.filename}
          jurisdiction={project.jurisdiction_code}
          ocrConfidence={document.ocrConfidence ?? 0.98}
          status={document.status}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Scrollable Tab Content Container */}
        <main
          id="main-tab-content"
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar pb-24 md:pb-12 space-y-6"
        >
          {/* Contextual Legal Disclaimer Banner */}
          <section
            aria-label="Contextual legal disclaimer banner"
            className="flex items-start gap-3 p-4 bg-accent-subtle border border-accent-line border-l-4 border-l-accent rounded-xl"
          >
            <span aria-hidden="true" className="text-xl">⚖️</span>
            <div>
              <h2 className="text-xs font-bold text-fg uppercase tracking-wider">
                Legal Information Notice
              </h2>
              <p className="text-xs text-fg-muted mt-0.5 leading-relaxed">
                ClauseIQX provides automated document analysis and clause extraction grounded directly in your uploaded file. This tool does not provide legal advice, representation, or outcome predictions.
              </p>
            </div>
          </section>

          {/* Tab Panes */}
          <div className="animate-in fade-in duration-300">
            {activeTab === 'overview' && (
              <ContractControlCenterTab
                project={project}
                document={document}
                analysis={analysis}
                readingLevel={readingLevel}
                onReadingLevelChange={handleReadingLevelChange}
                onNavigateTab={(tab: string) => setActiveTab(tab as WorkspaceTab)}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            )}

            {activeTab === 'clauses' && (
              <ClausesTab
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            )}

            {activeTab === 'review_points' && (
              <ReviewPointsTab
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            )}

            {activeTab === 'dates' && (
              <KeyDatesTab
                projectId={project.id}
                documentId={document.id}
                onExportIcs={() => setIsExportOpen(true)}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}

            {activeTab === 'ask_ai' && (
              <AskAiTab projectId={project.id} documentId={document.id} />
            )}

            {activeTab === 'compare' && (
              <CompareTab
                projectId={project.id}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            )}

            {activeTab === 'lawyer_prep' && (
              <LawyerPrepTab
                projectId={project.id}
                onExportBriefing={() => setIsExportOpen(true)}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Accessibility Settings Widget (Bottom Left) */}
      <AccessibilityWidget />

      {/* Mobile Bottom Navigation */}
      <WorkspaceMobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Modals */}
      <UploadModal
        projectId={project.id}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleDocumentUploaded}
      />

      <ExportModal
        projectId={project.id}
        projectName={project.name}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
