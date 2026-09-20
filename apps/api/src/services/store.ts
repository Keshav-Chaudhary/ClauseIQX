import * as crypto from 'crypto';
import { Pool, PoolClient } from 'pg';
import { loadConfig } from '../config';
import {
  User,
  Project,
  ProjectMember,
  AuditEvent,
  UserRole,
  Document,
  DocumentVersion,
  DocumentChunk,
  DocumentEmbedding,
  Analysis,
  AnalysisFinding,
  FindingCitation,
  Conversation,
  Message,
  MessageCitation,
  Comparison,
  ComparisonChange,
  ComparisonChangeCitation,
  LawyerPrepDraft,
  Export,
  Job,
  DocumentStatus,
  ScanStatus,
  ExtractionStatus,
  AnalysisStatus,
  AnalysisType,
  FindingType,
  Confidence,
  MessageRole,
  MessageStatus,
  ComparisonStatus,
  ChangeType,
  Materiality,
  LawyerPrepDraftStatus,
  ExportFormat,
  ExportSourceType,
  ExportStatus,
} from '@clauseiqx/shared-types';

export interface UserRecord extends User {
  password_hash: string;
}

export interface StoreSnapshot {
  users: UserRecord[];
  projects: Project[];
  projectMembers: ProjectMember[];
  documents: Document[];
  documentVersions: DocumentVersion[];
  documentChunks: DocumentChunk[];
  documentEmbeddings: DocumentEmbedding[];
  analyses: Analysis[];
  analysisFindings: AnalysisFinding[];
  findingCitations: FindingCitation[];
  conversations: Conversation[];
  messages: Message[];
  messageCitations: MessageCitation[];
  comparisons: Comparison[];
  comparisonChanges: ComparisonChange[];
  comparisonChangeCitations: ComparisonChangeCitation[];
  lawyerPrepDrafts: LawyerPrepDraft[];
  exports: Export[];
  jobs: Job[];
  auditEvents: AuditEvent[];
}

export class MemoryDataStore {
  private users = new Map<string, UserRecord>();
  private projects = new Map<string, Project>();
  private projectMembers = new Map<string, ProjectMember>();
  private documents = new Map<string, Document>();
  private documentVersions = new Map<string, DocumentVersion>();
  private documentChunks = new Map<string, DocumentChunk>();
  private documentEmbeddings = new Map<string, DocumentEmbedding[]>();
  private analyses = new Map<string, Analysis>();
  private analysisFindings = new Map<string, AnalysisFinding>();
  private findingCitations = new Map<string, FindingCitation[]>();
  private conversations = new Map<string, Conversation>();
  private messages = new Map<string, Message>();
  private messageCitations = new Map<string, MessageCitation[]>();
  private comparisons = new Map<string, Comparison>();
  private comparisonChanges = new Map<string, ComparisonChange>();
  private comparisonChangeCitations = new Map<string, ComparisonChangeCitation[]>();
  private lawyerPrepDrafts = new Map<string, LawyerPrepDraft>();
  private exports = new Map<string, Export>();
  private jobs = new Map<string, Job>();
  private auditEvents: AuditEvent[] = [];

  // ==========================================
  // 1. USER OPERATIONS
  // ==========================================

  createUser(email: string, passwordHash: string, displayName?: string): User {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`User with email ${normalizedEmail} already exists.`);
    }

    const now = new Date().toISOString();
    const userRecord: UserRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      display_name: displayName || null,
      auth_provider: 'local',
      status: 'active',
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    };

    this.users.set(userRecord.id, userRecord);
    return this.sanitizeUser(userRecord);
  }

  findUserByEmail(email: string): UserRecord | null {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email === normalized) {
        return u;
      }
    }
    return null;
  }

  findUserById(id: string): User | null {
    const u = this.users.get(id);
    return u ? this.sanitizeUser(u) : null;
  }

  getUserRecord(id: string): UserRecord | null {
    return this.users.get(id) || null;
  }

  private sanitizeUser(userRecord: UserRecord): User {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = userRecord;
    return safeUser;
  }

  // ==========================================
  // 2. PROJECT OPERATIONS
  // ==========================================

  createProject(
    ownerUserId: string,
    name: string,
    jurisdictionCode?: string | null,
    documentType?: string | null
  ): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      owner_user_id: ownerUserId,
      name,
      jurisdiction_code: jurisdictionCode && jurisdictionCode.trim() ? jurisdictionCode.trim() : 'unknown',
      document_type: documentType || null,
      status: 'active',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    this.projects.set(project.id, project);
    this.addProjectMember(project.id, ownerUserId, 'owner');
    return project;
  }

  findProjectById(id: string, includeDeleted = false): Project | null {
    const p = this.projects.get(id);
    if (!p) return null;
    if (!includeDeleted && p.deleted_at !== null && p.deleted_at !== undefined) {
      return null;
    }
    return p;
  }

  findProjectsForUser(userId: string): Project[] {
    const userProjects: Project[] = [];
    for (const project of this.projects.values()) {
      if (project.deleted_at !== null && project.deleted_at !== undefined) {
        continue;
      }
      const role = this.getUserProjectRole(project.id, userId);
      if (role !== null) {
        userProjects.push(project);
      }
    }
    return userProjects.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  updateProject(
    id: string,
    updates: Partial<Pick<Project, 'name' | 'jurisdiction_code' | 'document_type' | 'status'>>
  ): Project | null {
    const project = this.findProjectById(id);
    if (!project) return null;

    if (updates.name !== undefined) project.name = updates.name;
    if (updates.jurisdiction_code !== undefined) {
      project.jurisdiction_code = updates.jurisdiction_code || 'unknown';
    }
    if (updates.document_type !== undefined) project.document_type = updates.document_type;
    if (updates.status !== undefined) project.status = updates.status;
    project.updated_at = new Date().toISOString();

    this.projects.set(id, project);
    return project;
  }

  softDeleteProject(id: string): boolean {
    const project = this.projects.get(id);
    if (!project) return false;

    if (project.deleted_at !== null && project.deleted_at !== undefined) {
      return true;
    }

    const now = new Date().toISOString();
    project.deleted_at = now;
    project.status = 'deleted';
    project.updated_at = now;
    this.projects.set(id, project);

    // Cascade soft deletion to project documents
    for (const doc of this.documents.values()) {
      if (doc.project_id === id && !doc.deleted_at) {
        this.softDeleteDocument(doc.id);
      }
    }

    return true;
  }

  // ==========================================
  // 3. PROJECT MEMBER & ROLE OPERATIONS
  // ==========================================

  addProjectMember(projectId: string, userId: string, role: UserRole): ProjectMember {
    const key = `${projectId}:${userId}`;
    const member: ProjectMember = {
      id: crypto.randomUUID(),
      project_id: projectId,
      user_id: userId,
      role,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    };
    this.projectMembers.set(key, member);
    return member;
  }

  getUserProjectRole(projectId: string, userId: string): UserRole | null {
    const key = `${projectId}:${userId}`;
    const member = this.projectMembers.get(key);
    if (member) {
      return member.role;
    }

    const project = this.projects.get(projectId);
    if (project && project.owner_user_id === userId) {
      return 'owner';
    }

    return null;
  }

  // ==========================================
  // 4. DOCUMENT OPERATIONS (05_Backend_Schema.md §5)
  // ==========================================

  createDocument(params: {
    projectId: string;
    uploadedByUserId: string;
    filename: string;
    mediaType: string;
    byteSize: number;
    sha256: string;
    storageObjectKey?: string | null;
    pageCount?: number | null;
    status?: DocumentStatus;
    scanStatus?: ScanStatus;
  }): Document {
    const now = new Date().toISOString();
    const doc: Document = {
      id: crypto.randomUUID(),
      project_id: params.projectId,
      uploaded_by_user_id: params.uploadedByUserId,
      filename: params.filename,
      media_type: params.mediaType,
      byte_size: params.byteSize,
      sha256: params.sha256,
      status: params.status || 'UPLOADING',
      page_count: params.pageCount ?? null,
      storage_object_key: params.storageObjectKey ?? null,
      scan_status: params.scanStatus || 'PENDING',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    this.documents.set(doc.id, doc);
    return doc;
  }

  findDocumentById(id: string, includeDeleted = false): Document | null {
    const doc = this.documents.get(id);
    if (!doc) return null;
    if (!includeDeleted && doc.deleted_at !== null && doc.deleted_at !== undefined) {
      return null;
    }
    return doc;
  }

  findDocumentsForProject(projectId: string, includeDeleted = false): Document[] {
    const docs: Document[] = [];
    for (const doc of this.documents.values()) {
      if (doc.project_id !== projectId) continue;
      if (!includeDeleted && doc.deleted_at !== null && doc.deleted_at !== undefined) {
        continue;
      }
      docs.push(doc);
    }
    return docs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  updateDocument(
    id: string,
    updates: Partial<Pick<Document, 'status' | 'scan_status' | 'page_count' | 'storage_object_key' | 'media_type'>>
  ): Document | null {
    const doc = this.documents.get(id);
    if (!doc) return null;

    if (updates.status !== undefined) doc.status = updates.status;
    if (updates.scan_status !== undefined) doc.scan_status = updates.scan_status;
    if (updates.page_count !== undefined) doc.page_count = updates.page_count;
    if (updates.storage_object_key !== undefined) doc.storage_object_key = updates.storage_object_key;
    if (updates.media_type !== undefined) doc.media_type = updates.media_type;
    doc.updated_at = new Date().toISOString();

    this.documents.set(id, doc);
    return doc;
  }

  softDeleteDocument(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) return false;

    if (doc.deleted_at !== null && doc.deleted_at !== undefined) {
      return true; // idempotent
    }

    const now = new Date().toISOString();
    doc.deleted_at = now;
    doc.status = 'DELETED';
    doc.updated_at = now;
    this.documents.set(id, doc);
    return true;
  }

  // ==========================================
  // 5. DOCUMENT VERSIONS (05_Backend_Schema.md §6)
  // ==========================================

  createDocumentVersion(params: {
    documentId: string;
    versionNumber: number;
    contentSha256: string;
    extractorVersion: string;
    languageCode?: string | null;
    extractionStatus?: ExtractionStatus;
  }): DocumentVersion {
    const now = new Date().toISOString();
    const version: DocumentVersion = {
      id: crypto.randomUUID(),
      document_id: params.documentId,
      version_number: params.versionNumber,
      content_sha256: params.contentSha256,
      extractor_version: params.extractorVersion,
      language_code: params.languageCode ?? null,
      extraction_status: params.extractionStatus || 'pending',
      created_at: now,
    };

    this.documentVersions.set(version.id, version);
    return version;
  }

  findDocumentVersions(documentId: string): DocumentVersion[] {
    const versions: DocumentVersion[] = [];
    for (const v of this.documentVersions.values()) {
      if (v.document_id === documentId) {
        versions.push(v);
      }
    }
    return versions.sort((a, b) => b.version_number - a.version_number);
  }

  findDocumentVersionById(id: string): DocumentVersion | null {
    return this.documentVersions.get(id) || null;
  }

  getLatestDocumentVersion(documentId: string): DocumentVersion | null {
    const versions = this.findDocumentVersions(documentId);
    return versions.length > 0 ? versions[0] : null;
  }

  // ==========================================
  // 6. DOCUMENT CHUNKS & EMBEDDINGS (05_Backend_Schema.md §7 & §8)
  // ==========================================

  createDocumentChunk(chunk: DocumentChunk): DocumentChunk {
    this.documentChunks.set(chunk.id, chunk);
    return chunk;
  }

  createDocumentChunks(chunks: DocumentChunk[]): DocumentChunk[] {
    for (const c of chunks) {
      this.documentChunks.set(c.id, c);
    }
    return chunks;
  }

  findChunksForVersion(versionId: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    for (const c of this.documentChunks.values()) {
      if (c.document_version_id === versionId) {
        chunks.push(c);
      }
    }
    return chunks.sort((a, b) => a.chunk_index - b.chunk_index);
  }

  findChunkById(chunkId: string): DocumentChunk | null {
    return this.documentChunks.get(chunkId) || null;
  }

  saveDocumentEmbedding(chunkId: string, embeddingModel: string, embedding: number[]): DocumentEmbedding {
    const record: DocumentEmbedding = {
      chunk_id: chunkId,
      embedding_model: embeddingModel,
      embedding,
      created_at: new Date().toISOString(),
    };

    const existing = this.documentEmbeddings.get(chunkId) || [];
    const filtered = existing.filter((e) => e.embedding_model !== embeddingModel);
    filtered.push(record);
    this.documentEmbeddings.set(chunkId, filtered);
    return record;
  }

  findEmbeddingsForChunk(chunkId: string): DocumentEmbedding[] {
    return this.documentEmbeddings.get(chunkId) || [];
  }

  // ==========================================
  // 7. ANALYSES & FINDINGS (05_Backend_Schema.md §9 & §10)
  // ==========================================

  createAnalysis(params: {
    documentId: string;
    analysisType: AnalysisType;
    promptVersion: string;
    modelProvider?: string | null;
    modelName?: string | null;
    status?: AnalysisStatus;
    result?: Record<string, unknown> | null;
  }): Analysis {
    const now = new Date().toISOString();
    const analysis: Analysis = {
      id: crypto.randomUUID(),
      document_id: params.documentId,
      analysis_type: params.analysisType,
      model_provider: params.modelProvider ?? null,
      model_name: params.modelName ?? null,
      prompt_version: params.promptVersion,
      status: params.status || 'pending',
      result: params.result ?? null,
      created_at: now,
      completed_at: null,
    };

    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  findAnalysesForDocument(documentId: string): Analysis[] {
    const list: Analysis[] = [];
    for (const a of this.analyses.values()) {
      if (a.document_id === documentId) {
        list.push(a);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  findAnalysisById(analysisId: string): Analysis | null {
    return this.analyses.get(analysisId) || null;
  }

  updateAnalysis(
    analysisId: string,
    updates: Partial<Pick<Analysis, 'status' | 'result' | 'completed_at'>>
  ): Analysis | null {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) return null;

    if (updates.status !== undefined) analysis.status = updates.status;
    if (updates.result !== undefined) analysis.result = updates.result;
    if (updates.completed_at !== undefined) analysis.completed_at = updates.completed_at;

    this.analyses.set(analysisId, analysis);
    return analysis;
  }

  createAnalysisFinding(params: {
    analysisId: string;
    findingType: FindingType;
    title: string;
    explanation: string;
    confidence?: Confidence | null;
    citationChunkIds: string[];
  }): AnalysisFinding {
    if (!params.citationChunkIds || params.citationChunkIds.length === 0) {
      throw new Error('Mandatory violation: Every analysis finding must have at least one citation chunk ID.');
    }

    const finding: AnalysisFinding = {
      id: crypto.randomUUID(),
      analysis_id: params.analysisId,
      finding_type: params.findingType,
      confidence: params.confidence ?? 'high',
      title: params.title,
      explanation: params.explanation,
      created_at: new Date().toISOString(),
      citation_chunk_ids: params.citationChunkIds,
    };

    this.analysisFindings.set(finding.id, finding);

    const citations: FindingCitation[] = params.citationChunkIds.map((cid) => ({
      finding_id: finding.id,
      chunk_id: cid,
    }));
    this.findingCitations.set(finding.id, citations);

    return finding;
  }

  findFindingsForAnalysis(analysisId: string): AnalysisFinding[] {
    const list: AnalysisFinding[] = [];
    for (const f of this.analysisFindings.values()) {
      if (f.analysis_id === analysisId) {
        list.push(f);
      }
    }
    return list;
  }

  // ==========================================
  // 8. CONVERSATIONS & MESSAGES (05_Backend_Schema.md §11)
  // ==========================================

  createConversation(projectId: string, userId: string, title?: string | null): Conversation {
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: crypto.randomUUID(),
      project_id: projectId,
      user_id: userId,
      title: title ?? null,
      created_at: now,
      updated_at: now,
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  findConversationById(id: string): Conversation | null {
    return this.conversations.get(id) || null;
  }

  findConversationsForProject(projectId: string, userId?: string): Conversation[] {
    const list: Conversation[] = [];
    for (const c of this.conversations.values()) {
      if (c.project_id === projectId) {
        if (!userId || c.user_id === userId) {
          list.push(c);
        }
      }
    }
    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  createMessage(params: {
    conversationId: string;
    role: MessageRole;
    content: string;
    status: MessageStatus;
    modelName?: string | null;
    promptVersion?: string | null;
    citations?: MessageCitation[];
  }): Message {
    const message: Message = {
      id: crypto.randomUUID(),
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      status: params.status,
      model_name: params.modelName ?? null,
      prompt_version: params.promptVersion ?? null,
      created_at: new Date().toISOString(),
      citations: params.citations || [],
    };

    this.messages.set(message.id, message);

    if (params.citations && params.citations.length > 0) {
      this.messageCitations.set(message.id, params.citations);
    }

    const conv = this.conversations.get(params.conversationId);
    if (conv) {
      conv.updated_at = new Date().toISOString();
    }

    return message;
  }

  findMessagesForConversation(conversationId: string): Message[] {
    const list: Message[] = [];
    for (const m of this.messages.values()) {
      if (m.conversation_id === conversationId) {
        list.push(m);
      }
    }
    return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // ==========================================
  // 9. COMPARISONS (05_Backend_Schema.md §12)
  // ==========================================

  createComparison(params: {
    projectId: string;
    documentAId: string;
    documentBId: string;
    status?: ComparisonStatus;
    modelName?: string | null;
    promptVersion?: string | null;
    summary?: Record<string, unknown> | null;
  }): Comparison {
    if (params.documentAId === params.documentBId) {
      throw new Error('Comparison requires two distinct documents.');
    }

    const comparison: Comparison = {
      id: crypto.randomUUID(),
      project_id: params.projectId,
      document_a_id: params.documentAId,
      document_b_id: params.documentBId,
      status: params.status || 'pending',
      model_name: params.modelName ?? null,
      prompt_version: params.promptVersion ?? null,
      summary: params.summary ?? null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    this.comparisons.set(comparison.id, comparison);
    return comparison;
  }

  findComparisonById(id: string): Comparison | null {
    return this.comparisons.get(id) || null;
  }

  findComparisonsForProject(projectId: string): Comparison[] {
    const list: Comparison[] = [];
    for (const c of this.comparisons.values()) {
      if (c.project_id === projectId) {
        list.push(c);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  updateComparison(
    id: string,
    updates: Partial<Pick<Comparison, 'status' | 'summary' | 'completed_at'>>
  ): Comparison | null {
    const comp = this.comparisons.get(id);
    if (!comp) return null;

    if (updates.status !== undefined) comp.status = updates.status;
    if (updates.summary !== undefined) comp.summary = updates.summary;
    if (updates.completed_at !== undefined) comp.completed_at = updates.completed_at;

    this.comparisons.set(id, comp);
    return comp;
  }

  createComparisonChange(params: {
    comparisonId: string;
    changeType: ChangeType;
    materiality: Materiality;
    title: string;
    explanation: string;
    oldText?: string | null;
    newText?: string | null;
    citations: ComparisonChangeCitation[];
  }): ComparisonChange {
    if (!params.citations || params.citations.length === 0) {
      throw new Error('Mandatory violation: Every comparison change must have at least one citation.');
    }

    const change: ComparisonChange = {
      id: crypto.randomUUID(),
      comparison_id: params.comparisonId,
      change_type: params.changeType,
      materiality: params.materiality,
      title: params.title,
      explanation: params.explanation,
      old_text: params.oldText ?? null,
      new_text: params.newText ?? null,
      created_at: new Date().toISOString(),
      citations: params.citations,
    };

    this.comparisonChanges.set(change.id, change);
    this.comparisonChangeCitations.set(change.id, params.citations);
    return change;
  }

  findChangesForComparison(comparisonId: string): ComparisonChange[] {
    const list: ComparisonChange[] = [];
    for (const ch of this.comparisonChanges.values()) {
      if (ch.comparison_id === comparisonId) {
        list.push(ch);
      }
    }
    return list;
  }

  // ==========================================
  // 10. LAWYER PREP DRAFTS (05_Backend_Schema.md §13)
  // ==========================================

  createLawyerPrepDraft(params: {
    projectId: string;
    createdByUserId: string;
    situationSummary?: string | null;
    keyClauses?: Record<string, unknown> | null;
    keyDates?: Record<string, unknown> | null;
    factsStillNeeded?: Record<string, unknown> | null;
    questionsForLawyer?: Record<string, unknown> | null;
    userNotes?: string | null;
    status?: LawyerPrepDraftStatus;
  }): LawyerPrepDraft {
    const now = new Date().toISOString();
    const draft: LawyerPrepDraft = {
      id: crypto.randomUUID(),
      project_id: params.projectId,
      created_by_user_id: params.createdByUserId,
      situation_summary: params.situationSummary ?? null,
      key_clauses: params.keyClauses ?? null,
      key_dates: params.keyDates ?? null,
      facts_still_needed: params.factsStillNeeded ?? null,
      questions_for_lawyer: params.questionsForLawyer ?? null,
      user_notes: params.userNotes ?? null,
      status: params.status || 'draft',
      created_at: now,
      updated_at: now,
    };

    this.lawyerPrepDrafts.set(draft.id, draft);
    return draft;
  }

  findLawyerPrepDraftById(id: string): LawyerPrepDraft | null {
    return this.lawyerPrepDrafts.get(id) || null;
  }

  findLawyerPrepDraftsForProject(projectId: string): LawyerPrepDraft[] {
    const list: LawyerPrepDraft[] = [];
    for (const d of this.lawyerPrepDrafts.values()) {
      if (d.project_id === projectId) {
        list.push(d);
      }
    }
    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  updateLawyerPrepDraft(
    id: string,
    updates: Partial<Omit<LawyerPrepDraft, 'id' | 'project_id' | 'created_by_user_id' | 'created_at'>>
  ): LawyerPrepDraft | null {
    const draft = this.lawyerPrepDrafts.get(id);
    if (!draft) return null;

    if (updates.situation_summary !== undefined) draft.situation_summary = updates.situation_summary;
    if (updates.key_clauses !== undefined) draft.key_clauses = updates.key_clauses;
    if (updates.key_dates !== undefined) draft.key_dates = updates.key_dates;
    if (updates.facts_still_needed !== undefined) draft.facts_still_needed = updates.facts_still_needed;
    if (updates.questions_for_lawyer !== undefined) draft.questions_for_lawyer = updates.questions_for_lawyer;
    if (updates.user_notes !== undefined) draft.user_notes = updates.user_notes;
    if (updates.status !== undefined) draft.status = updates.status;
    draft.updated_at = new Date().toISOString();

    this.lawyerPrepDrafts.set(id, draft);
    return draft;
  }

  // ==========================================
  // 11. EXPORTS (05_Backend_Schema.md §14)
  // ==========================================

  createExport(params: {
    projectId: string;
    requestedByUserId: string;
    exportSourceType: ExportSourceType;
    format: ExportFormat;
    status?: ExportStatus;
    storageObjectKey?: string | null;
    expiresAt?: string | null;
  }): Export {
    const record: Export = {
      id: crypto.randomUUID(),
      project_id: params.projectId,
      requested_by_user_id: params.requestedByUserId,
      export_source_type: params.exportSourceType,
      format: params.format,
      status: params.status || 'queued',
      storage_object_key: params.storageObjectKey ?? null,
      expires_at: params.expiresAt ?? new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour expiry
      created_at: new Date().toISOString(),
    };

    this.exports.set(record.id, record);
    return record;
  }

  findExportById(id: string): Export | null {
    return this.exports.get(id) || null;
  }

  findExportsForProject(projectId: string): Export[] {
    const list: Export[] = [];
    for (const e of this.exports.values()) {
      if (e.project_id === projectId) {
        list.push(e);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  updateExport(
    id: string,
    updates: Partial<Pick<Export, 'status' | 'storage_object_key' | 'expires_at'>>
  ): Export | null {
    const exp = this.exports.get(id);
    if (!exp) return null;

    if (updates.status !== undefined) exp.status = updates.status;
    if (updates.storage_object_key !== undefined) exp.storage_object_key = updates.storage_object_key;
    if (updates.expires_at !== undefined) exp.expires_at = updates.expires_at;

    this.exports.set(id, exp);
    return exp;
  }

  // ==========================================
  // 12. JOBS (05_Backend_Schema.md §16)
  // ==========================================

  createJob(jobType: string, resourceType: string, resourceId: string): Job {
    const job: Job = {
      id: crypto.randomUUID(),
      job_type: jobType,
      resource_type: resourceType,
      resource_id: resourceId,
      status: 'QUEUED',
      attempts: 0,
      last_error_code: null,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  findJobById(id: string): Job | null {
    return this.jobs.get(id) || null;
  }

  updateJob(
    id: string,
    updates: Partial<Pick<Job, 'status' | 'attempts' | 'last_error_code' | 'started_at' | 'completed_at'>>
  ): Job | null {
    const job = this.jobs.get(id);
    if (!job) return null;

    if (updates.status !== undefined) job.status = updates.status;
    if (updates.attempts !== undefined) job.attempts = updates.attempts;
    if (updates.last_error_code !== undefined) job.last_error_code = updates.last_error_code;
    if (updates.started_at !== undefined) job.started_at = updates.started_at;
    if (updates.completed_at !== undefined) job.completed_at = updates.completed_at;

    this.jobs.set(id, job);
    return job;
  }

  // ==========================================
  // 13. AUDIT EVENT OPERATIONS (05_Backend_Schema.md §15)
  // ==========================================

  createAuditEvent(
    eventType: string,
    options: {
      actorUserId?: string | null;
      projectId?: string | null;
      resourceType?: string | null;
      resourceId?: string | null;
      requestId?: string | null;
      metadata?: Record<string, unknown>;
    }
  ): AuditEvent {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      actor_user_id: options.actorUserId || null,
      project_id: options.projectId || null,
      event_type: eventType,
      resource_type: options.resourceType || null,
      resource_id: options.resourceId || null,
      request_id: options.requestId || null,
      metadata: options.metadata || {},
      created_at: new Date().toISOString(),
    };

    this.auditEvents.push(event);
    return event;
  }

  getAuditEventsForProject(projectId: string): AuditEvent[] {
    return this.auditEvents.filter((e) => e.project_id === projectId);
  }

  exportSnapshot(): StoreSnapshot {
    return {
      users: [...this.users.values()],
      projects: [...this.projects.values()],
      projectMembers: [...this.projectMembers.values()],
      documents: [...this.documents.values()],
      documentVersions: [...this.documentVersions.values()],
      documentChunks: [...this.documentChunks.values()],
      documentEmbeddings: [...this.documentEmbeddings.values()].flat(),
      analyses: [...this.analyses.values()],
      analysisFindings: [...this.analysisFindings.values()],
      findingCitations: [...this.findingCitations.values()].flat(),
      conversations: [...this.conversations.values()],
      messages: [...this.messages.values()],
      messageCitations: [...this.messageCitations.values()].flat(),
      comparisons: [...this.comparisons.values()],
      comparisonChanges: [...this.comparisonChanges.values()],
      comparisonChangeCitations: [...this.comparisonChangeCitations.values()].flat(),
      lawyerPrepDrafts: [...this.lawyerPrepDrafts.values()],
      exports: [...this.exports.values()],
      jobs: [...this.jobs.values()],
      auditEvents: [...this.auditEvents],
    };
  }

  importSnapshot(snapshot: StoreSnapshot): void {
    this.clear();
    for (const item of snapshot.users) this.users.set(item.id, item);
    for (const item of snapshot.projects) this.projects.set(item.id, item);
    for (const item of snapshot.projectMembers) this.projectMembers.set(`${item.project_id}:${item.user_id}`, item);
    for (const item of snapshot.documents) this.documents.set(item.id, item);
    for (const item of snapshot.documentVersions) this.documentVersions.set(item.id, item);
    for (const item of snapshot.documentChunks) this.documentChunks.set(item.id, item);
    for (const item of snapshot.documentEmbeddings) {
      const existing = this.documentEmbeddings.get(item.chunk_id) || [];
      existing.push(item);
      this.documentEmbeddings.set(item.chunk_id, existing);
    }
    for (const item of snapshot.analyses) this.analyses.set(item.id, item);
    for (const item of snapshot.analysisFindings) this.analysisFindings.set(item.id, item);
    for (const item of snapshot.findingCitations) {
      const existing = this.findingCitations.get(item.finding_id) || [];
      existing.push(item);
      this.findingCitations.set(item.finding_id, existing);
    }
    for (const item of snapshot.conversations) this.conversations.set(item.id, item);
    for (const item of snapshot.messages) this.messages.set(item.id, item);
    for (const item of snapshot.messageCitations) {
      const existing = this.messageCitations.get(item.message_id) || [];
      existing.push(item);
      this.messageCitations.set(item.message_id, existing);
    }
    for (const item of snapshot.comparisons) this.comparisons.set(item.id, item);
    for (const item of snapshot.comparisonChanges) this.comparisonChanges.set(item.id, item);
    for (const item of snapshot.comparisonChangeCitations) {
      const existing = this.comparisonChangeCitations.get(item.change_id) || [];
      existing.push(item);
      this.comparisonChangeCitations.set(item.change_id, existing);
    }
    for (const item of snapshot.lawyerPrepDrafts) this.lawyerPrepDrafts.set(item.id, item);
    for (const item of snapshot.exports) this.exports.set(item.id, item);
    for (const item of snapshot.jobs) this.jobs.set(item.id, item);
    this.auditEvents.push(...snapshot.auditEvents);
  }

  clear(): void {
    this.users.clear();
    this.projects.clear();
    this.projectMembers.clear();
    this.documents.clear();
    this.documentVersions.clear();
    this.documentChunks.clear();
    this.documentEmbeddings.clear();
    this.analyses.clear();
    this.analysisFindings.clear();
    this.findingCitations.clear();
    this.conversations.clear();
    this.messages.clear();
    this.messageCitations.clear();
    this.comparisons.clear();
    this.comparisonChanges.clear();
    this.comparisonChangeCitations.clear();
    this.lawyerPrepDrafts.clear();
    this.exports.clear();
    this.jobs.clear();
    this.auditEvents = [];
  }
}

/**
 * PostgreSQL-backed persistence adapter. The existing synchronous service
 * contract is hydrated at startup and flushed transactionally after writes.
 */
export class PostgresDataStore extends MemoryDataStore {
  private readonly pool: Pool;
  private flushChain: Promise<void> = Promise.resolve();

  constructor(databaseUrl: string) {
    super();
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async initialize(): Promise<void> {
    const tables = [
      'users', 'projects', 'project_members', 'documents', 'document_versions',
      'document_chunks', 'document_embeddings', 'analyses', 'analysis_findings',
      'finding_citations', 'conversations', 'messages', 'message_citations',
      'comparisons', 'comparison_changes', 'comparison_change_citations',
      'lawyer_prep_drafts', 'exports', 'jobs', 'audit_events',
    ];
    const client = await this.pool.connect();
    try {
      const rows: Record<string, unknown[]> = {};
      for (const table of tables) {
        const result = await client.query(`SELECT row_to_json("${table}") AS row FROM "${table}"`);
        rows[table] = result.rows.map((row: { row: unknown }) => row.row);
      }
      this.importSnapshot(this.fromDatabaseRows(rows));
    } finally {
      client.release();
    }
  }

  private fromDatabaseRows(rows: Record<string, unknown[]>): StoreSnapshot {
    const embeddings = (rows.document_embeddings || []).map((row) => {
      const value = row as Record<string, unknown>;
      const raw = String(value.embedding || '[]').replace(/^\[|\]$/g, '');
      return {
        ...value,
        embedding: raw ? raw.split(',').map(Number) : [],
      } as unknown as DocumentEmbedding;
    });
    return {
      users: rows.users as UserRecord[],
      projects: rows.projects as Project[],
      projectMembers: rows.project_members as ProjectMember[],
      documents: rows.documents as Document[],
      documentVersions: rows.document_versions as DocumentVersion[],
      documentChunks: rows.document_chunks as DocumentChunk[],
      documentEmbeddings: embeddings,
      analyses: rows.analyses as Analysis[],
      analysisFindings: rows.analysis_findings as AnalysisFinding[],
      findingCitations: rows.finding_citations as FindingCitation[],
      conversations: rows.conversations as Conversation[],
      messages: (rows.messages || []).map((message) => ({ ...(message as Message), citations: [] })) as Message[],
      messageCitations: rows.message_citations as MessageCitation[],
      comparisons: rows.comparisons as Comparison[],
      comparisonChanges: (rows.comparison_changes || []).map((change) => ({ ...(change as ComparisonChange), citations: [] })) as ComparisonChange[],
      comparisonChangeCitations: rows.comparison_change_citations as ComparisonChangeCitation[],
      lawyerPrepDrafts: rows.lawyer_prep_drafts as LawyerPrepDraft[],
      exports: rows.exports as Export[],
      jobs: rows.jobs as Job[],
      auditEvents: rows.audit_events as AuditEvent[],
    };
  }

  persist(): void {
    this.flushChain = this.flushChain
      .then(() => this.flushSnapshot())
      .catch((error: unknown) => {
        console.error('[PostgresDataStore] Failed to persist state:', error);
        throw error;
      });
  }

  private async flushSnapshot(): Promise<void> {
    const snapshot = this.exportSnapshot();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'TRUNCATE TABLE users, projects, project_members, documents, document_versions, document_chunks, document_embeddings, analyses, analysis_findings, finding_citations, conversations, messages, message_citations, comparisons, comparison_changes, comparison_change_citations, lawyer_prep_drafts, exports, jobs, audit_events CASCADE'
      );
      await this.insertRows(client, 'users', snapshot.users);
      await this.insertRows(client, 'projects', snapshot.projects);
      await this.insertRows(client, 'project_members', snapshot.projectMembers);
      await this.insertRows(client, 'documents', snapshot.documents);
      await this.insertRows(client, 'document_versions', snapshot.documentVersions);
      await this.insertRows(client, 'document_chunks', snapshot.documentChunks);
      await this.insertRows(client, 'analyses', snapshot.analyses);
      await this.insertRows(client, 'analysis_findings', snapshot.analysisFindings.map(({ citation_chunk_ids: _citations, ...row }) => row));
      await this.insertRows(client, 'finding_citations', snapshot.findingCitations);
      await this.insertRows(client, 'conversations', snapshot.conversations);
      await this.insertRows(client, 'messages', snapshot.messages.map(({ citations: _citations, ...row }) => row));
      await this.insertRows(client, 'message_citations', snapshot.messageCitations);
      await this.insertRows(client, 'comparisons', snapshot.comparisons);
      await this.insertRows(client, 'comparison_changes', snapshot.comparisonChanges.map(({ citations: _citations, ...row }) => row));
      await this.insertRows(client, 'comparison_change_citations', snapshot.comparisonChangeCitations);
      await this.insertRows(client, 'lawyer_prep_drafts', snapshot.lawyerPrepDrafts);
      await this.insertRows(client, 'exports', snapshot.exports);
      await this.insertRows(client, 'jobs', snapshot.jobs);
      await this.insertRows(client, 'audit_events', snapshot.auditEvents);
      for (const embedding of snapshot.documentEmbeddings) {
        await client.query(
          'INSERT INTO document_embeddings (chunk_id, embedding_model, embedding, created_at) VALUES ($1, $2, $3::vector, $4)',
          [embedding.chunk_id, embedding.embedding_model, `[${embedding.embedding.join(',')}]`, embedding.created_at]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertRows(client: PoolClient, table: string, rows: unknown[]): Promise<void> {
    if (rows.length === 0) return;
    await client.query(
      `INSERT INTO "${table}" SELECT * FROM jsonb_populate_recordset(NULL::"${table}", $1::jsonb)`,
      [JSON.stringify(rows)]
    );
  }

  async close(): Promise<void> {
    await this.flushChain;
    await this.pool.end();
  }
}

const mutatingMethods = new Set([
  'createUser', 'createProject', 'updateProject', 'softDeleteProject', 'addProjectMember',
  'createDocument', 'updateDocument', 'softDeleteDocument', 'createDocumentVersion',
  'createDocumentChunk', 'createDocumentChunks', 'saveDocumentEmbedding', 'createAnalysis',
  'updateAnalysis', 'createAnalysisFinding', 'createConversation', 'createMessage',
  'createComparison', 'updateComparison', 'createComparisonChange', 'createLawyerPrepDraft',
  'updateLawyerPrepDraft', 'createExport', 'updateExport', 'createJob', 'updateJob',
  'createAuditEvent', 'clear',
]);

function withPersistence<T extends MemoryDataStore>(store: T): T {
  return new Proxy(store, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function' || !mutatingMethods.has(String(property))) return value;
      return (...args: unknown[]) => {
        const result = value.apply(receiver, args);
        if (receiver instanceof PostgresDataStore) receiver.persist();
        return result;
      };
    },
  });
}

const runtimeConfig = loadConfig();
const storeMode = runtimeConfig.DATA_STORE;

export const dataStore: MemoryDataStore = withPersistence(
  storeMode === 'postgres' && runtimeConfig.DATABASE_URL
    ? new PostgresDataStore(runtimeConfig.DATABASE_URL)
    : new MemoryDataStore()
);
