import { z } from 'zod';

// ==========================================
// 1. ENUMS & CONSTANTS
// Match 05_Backend_Schema.md and PRD/TRD rules
// ==========================================

export const UserRoleSchema = z.enum(['owner', 'member', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const DocumentStatusSchema = z.enum([
  'UPLOADING',
  'QUARANTINED',
  'SCANNING',
  'PROCESSING',
  'READY',
  'FAILED',
  'DELETED',
]);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const ScanStatusSchema = z.enum([
  'PENDING',
  'CLEAN',
  'INFECTED',
  'FAILED',
]);
export type ScanStatus = z.infer<typeof ScanStatusSchema>;

export const ExtractionStatusSchema = z.enum([
  'pending',
  'extracting',
  'completed',
  'failed',
]);
export type ExtractionStatus = z.infer<typeof ExtractionStatusSchema>;

export const AnalysisTypeSchema = z.enum([
  'summary',
  'clauses',
  'review_points',
  'dates',
  'lawyer_prep',
]);
export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;

export const AnalysisStatusSchema = z.enum([
  'pending',
  'processing',
  'ready',
  'incomplete',
  'failed',
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

// Exact finding types from 05_Backend_Schema.md §10
// Notice: Terminology is strictly 'review_point', never 'risk_flag' or 'risk_level'
export const FindingTypeSchema = z.enum([
  'obligation',
  'right',
  'date',
  'fee',
  'termination',
  'liability',
  'indemnity',
  'privacy',
  'dispute',
  'inconsistency',
  'review_point',
]);
export type FindingType = z.infer<typeof FindingTypeSchema>;

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system_metadata']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageStatusSchema = z.enum([
  'sent',
  'processing',
  'delivered',
  'abstained',
  'failed',
]);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const ComparisonStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
]);
export type ComparisonStatus = z.infer<typeof ComparisonStatusSchema>;

export const ChangeTypeSchema = z.enum([
  'added',
  'removed',
  'modified',
  'reordered',
  'paraphrased',
]);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

export const MaterialitySchema = z.enum([
  'material',
  'minor',
  'formatting_only',
]);
export type Materiality = z.infer<typeof MaterialitySchema>;

export const SourceSideSchema = z.enum(['a', 'b']);
export type SourceSide = z.infer<typeof SourceSideSchema>;

export const LawyerPrepDraftStatusSchema = z.enum(['draft', 'finalized']);
export type LawyerPrepDraftStatus = z.infer<typeof LawyerPrepDraftStatusSchema>;

export const ExportFormatSchema = z.enum(['pdf', 'docx', 'markdown', 'ics']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ExportSourceTypeSchema = z.enum(['summary', 'comparison', 'lawyer_prep']);
export type ExportSourceType = z.infer<typeof ExportSourceTypeSchema>;

export const ExportStatusSchema = z.enum(['queued', 'processing', 'completed', 'failed']);
export type ExportStatus = z.infer<typeof ExportStatusSchema>;

export const JobStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED_RETRYABLE',
  'FAILED',
  'CANCELLED',
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

// ==========================================
// 2. ERROR CONTRACT
// Exact specification from 02_TRD.md §7
// ==========================================

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    request_id: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ==========================================
// 3. CORE ENTITY SCHEMAS (05_Backend_Schema.md)
// ==========================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().nullable().optional(),
  auth_provider: z.string(),
  status: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  owner_user_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  jurisdiction_code: z.string().nullable().optional(), // 'unknown' or code, never guessed
  document_type: z.string().nullable().optional(),
  status: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectMemberSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: UserRoleSchema,
  invited_at: z.string().datetime(),
  accepted_at: z.string().datetime().nullable().optional(),
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  uploaded_by_user_id: z.string().uuid(),
  filename: z.string().min(1),
  media_type: z.string(),
  byte_size: z.number().int().positive(),
  sha256: z.string().length(64),
  status: DocumentStatusSchema,
  page_count: z.number().int().nonnegative().nullable().optional(),
  storage_object_key: z.string().nullable().optional(),
  scan_status: ScanStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable().optional(),
});
export type Document = z.infer<typeof DocumentSchema>;

export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  version_number: z.number().int().positive(),
  content_sha256: z.string().length(64),
  extractor_version: z.string(),
  language_code: z.string().nullable().optional(),
  extraction_status: ExtractionStatusSchema,
  created_at: z.string().datetime(),
});
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

export const DocumentChunkSchema = z.object({
  id: z.string().uuid(),
  document_version_id: z.string().uuid(),
  chunk_index: z.number().int().nonnegative(),
  text_content: z.string(),
  page_start: z.number().int().positive().nullable().optional(),
  page_end: z.number().int().positive().nullable().optional(),
  section_title: z.string().nullable().optional(),
  char_start: z.number().int().nonnegative().nullable().optional(),
  char_end: z.number().int().nonnegative().nullable().optional(),
  extraction_confidence: z.number().min(0).max(1).nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});
export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;

export const DocumentEmbeddingSchema = z.object({
  chunk_id: z.string().uuid(),
  embedding_model: z.string(),
  embedding: z.array(z.number()),
  created_at: z.string().datetime(),
});
export type DocumentEmbedding = z.infer<typeof DocumentEmbeddingSchema>;

export const AnalysisSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  analysis_type: AnalysisTypeSchema,
  model_provider: z.string().nullable().optional(),
  model_name: z.string().nullable().optional(),
  prompt_version: z.string(),
  status: AnalysisStatusSchema,
  result: z.record(z.unknown()).nullable().optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const FindingCitationSchema = z.object({
  finding_id: z.string().uuid(),
  chunk_id: z.string().uuid(),
});
export type FindingCitation = z.infer<typeof FindingCitationSchema>;

export const AnalysisFindingSchema = z.object({
  id: z.string().uuid(),
  analysis_id: z.string().uuid(),
  finding_type: FindingTypeSchema,
  confidence: ConfidenceSchema.nullable().optional(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  created_at: z.string().datetime(),
  // Mandatory: at least one source chunk citation
  citation_chunk_ids: z.array(z.string().uuid()).min(1),
});
export type AnalysisFinding = z.infer<typeof AnalysisFindingSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const MessageCitationSchema = z.object({
  id: z.string().uuid(),
  message_id: z.string().uuid(),
  chunk_id: z.string().uuid(),
  relevance_score: z.number().nullable().optional(),
  created_at: z.string().datetime(),
});
export type MessageCitation = z.infer<typeof MessageCitationSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  status: MessageStatusSchema,
  model_name: z.string().nullable().optional(),
  prompt_version: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  citations: z.array(MessageCitationSchema).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ComparisonSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  document_a_id: z.string().uuid(),
  document_b_id: z.string().uuid(),
  status: ComparisonStatusSchema,
  model_name: z.string().nullable().optional(),
  prompt_version: z.string().nullable().optional(),
  summary: z.record(z.unknown()).nullable().optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
});
export type Comparison = z.infer<typeof ComparisonSchema>;

export const ComparisonChangeCitationSchema = z.object({
  change_id: z.string().uuid(),
  chunk_id: z.string().uuid(),
  source_side: SourceSideSchema,
});
export type ComparisonChangeCitation = z.infer<typeof ComparisonChangeCitationSchema>;

export const ComparisonChangeSchema = z.object({
  id: z.string().uuid(),
  comparison_id: z.string().uuid(),
  change_type: ChangeTypeSchema,
  materiality: MaterialitySchema,
  title: z.string().min(1),
  explanation: z.string().min(1),
  old_text: z.string().nullable().optional(),
  new_text: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  citations: z.array(ComparisonChangeCitationSchema).min(1),
});
export type ComparisonChange = z.infer<typeof ComparisonChangeSchema>;

export const LawyerPrepDraftSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  created_by_user_id: z.string().uuid(),
  situation_summary: z.string().nullable().optional(),
  key_clauses: z.record(z.unknown()).nullable().optional(),
  key_dates: z.record(z.unknown()).nullable().optional(),
  facts_still_needed: z.record(z.unknown()).nullable().optional(),
  questions_for_lawyer: z.record(z.unknown()).nullable().optional(),
  user_notes: z.string().nullable().optional(),
  status: LawyerPrepDraftStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type LawyerPrepDraft = z.infer<typeof LawyerPrepDraftSchema>;

export const ExportSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  requested_by_user_id: z.string().uuid(),
  export_source_type: ExportSourceTypeSchema,
  format: ExportFormatSchema,
  status: ExportStatusSchema,
  storage_object_key: z.string().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
});
export type Export = z.infer<typeof ExportSchema>;

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  actor_user_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  event_type: z.string().min(1),
  resource_type: z.string().nullable().optional(),
  resource_id: z.string().uuid().nullable().optional(),
  request_id: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const JobSchema = z.object({
  id: z.string().uuid(),
  job_type: z.string().min(1),
  resource_type: z.string().min(1),
  resource_id: z.string().uuid(),
  status: JobStatusSchema,
  attempts: z.number().int().nonnegative().default(0),
  last_error_code: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
});
export type Job = z.infer<typeof JobSchema>;
