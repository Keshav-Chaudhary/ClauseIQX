"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSchema = exports.AuditEventSchema = exports.ExportSchema = exports.LawyerPrepDraftSchema = exports.ComparisonChangeSchema = exports.ComparisonChangeCitationSchema = exports.ComparisonSchema = exports.MessageSchema = exports.MessageCitationSchema = exports.ConversationSchema = exports.AnalysisFindingSchema = exports.FindingCitationSchema = exports.AnalysisSchema = exports.DocumentEmbeddingSchema = exports.DocumentChunkSchema = exports.DocumentVersionSchema = exports.DocumentSchema = exports.ProjectMemberSchema = exports.ProjectSchema = exports.UserSchema = exports.ApiErrorSchema = exports.JobStatusSchema = exports.ExportStatusSchema = exports.ExportSourceTypeSchema = exports.ExportFormatSchema = exports.LawyerPrepDraftStatusSchema = exports.SourceSideSchema = exports.MaterialitySchema = exports.ChangeTypeSchema = exports.ComparisonStatusSchema = exports.MessageStatusSchema = exports.MessageRoleSchema = exports.ConfidenceSchema = exports.FindingTypeSchema = exports.AnalysisStatusSchema = exports.AnalysisTypeSchema = exports.ExtractionStatusSchema = exports.ScanStatusSchema = exports.DocumentStatusSchema = exports.UserRoleSchema = void 0;
const zod_1 = require("zod");
// ==========================================
// 1. ENUMS & CONSTANTS
// Match 05_Backend_Schema.md and PRD/TRD rules
// ==========================================
exports.UserRoleSchema = zod_1.z.enum(['owner', 'member', 'viewer']);
exports.DocumentStatusSchema = zod_1.z.enum([
    'UPLOADING',
    'QUARANTINED',
    'SCANNING',
    'PROCESSING',
    'READY',
    'FAILED',
    'DELETED',
]);
exports.ScanStatusSchema = zod_1.z.enum([
    'PENDING',
    'CLEAN',
    'INFECTED',
    'FAILED',
]);
exports.ExtractionStatusSchema = zod_1.z.enum([
    'pending',
    'extracting',
    'completed',
    'failed',
]);
exports.AnalysisTypeSchema = zod_1.z.enum([
    'summary',
    'clauses',
    'review_points',
    'dates',
    'lawyer_prep',
]);
exports.AnalysisStatusSchema = zod_1.z.enum([
    'pending',
    'processing',
    'ready',
    'incomplete',
    'failed',
]);
// Exact finding types from 05_Backend_Schema.md §10
// Notice: Terminology is strictly 'review_point', never 'risk_flag' or 'risk_level'
exports.FindingTypeSchema = zod_1.z.enum([
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
exports.ConfidenceSchema = zod_1.z.enum(['high', 'medium', 'low']);
exports.MessageRoleSchema = zod_1.z.enum(['user', 'assistant', 'system_metadata']);
exports.MessageStatusSchema = zod_1.z.enum([
    'sent',
    'processing',
    'delivered',
    'abstained',
    'failed',
]);
exports.ComparisonStatusSchema = zod_1.z.enum([
    'pending',
    'processing',
    'completed',
    'failed',
]);
exports.ChangeTypeSchema = zod_1.z.enum([
    'added',
    'removed',
    'modified',
    'reordered',
    'paraphrased',
]);
exports.MaterialitySchema = zod_1.z.enum([
    'material',
    'minor',
    'formatting_only',
]);
exports.SourceSideSchema = zod_1.z.enum(['a', 'b']);
exports.LawyerPrepDraftStatusSchema = zod_1.z.enum(['draft', 'finalized']);
exports.ExportFormatSchema = zod_1.z.enum(['pdf', 'docx', 'markdown', 'ics']);
exports.ExportSourceTypeSchema = zod_1.z.enum(['summary', 'comparison', 'lawyer_prep']);
exports.ExportStatusSchema = zod_1.z.enum(['queued', 'processing', 'completed', 'failed']);
exports.JobStatusSchema = zod_1.z.enum([
    'QUEUED',
    'RUNNING',
    'SUCCEEDED',
    'FAILED_RETRYABLE',
    'FAILED',
    'CANCELLED',
]);
// ==========================================
// 2. ERROR CONTRACT
// Exact specification from 02_TRD.md §7
// ==========================================
exports.ApiErrorSchema = zod_1.z.object({
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        request_id: zod_1.z.string(),
    }),
});
// ==========================================
// 3. CORE ENTITY SCHEMAS (05_Backend_Schema.md)
// ==========================================
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    display_name: zod_1.z.string().nullable().optional(),
    auth_provider: zod_1.z.string(),
    status: zod_1.z.string(),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
exports.ProjectSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    owner_user_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(255),
    jurisdiction_code: zod_1.z.string().nullable().optional(), // 'unknown' or code, never guessed
    document_type: zod_1.z.string().nullable().optional(),
    status: zod_1.z.string(),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
    deleted_at: zod_1.z.string().datetime().nullable().optional(),
});
exports.ProjectMemberSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    project_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    role: exports.UserRoleSchema,
    invited_at: zod_1.z.string().datetime(),
    accepted_at: zod_1.z.string().datetime().nullable().optional(),
});
exports.DocumentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    project_id: zod_1.z.string().uuid(),
    uploaded_by_user_id: zod_1.z.string().uuid(),
    filename: zod_1.z.string().min(1),
    media_type: zod_1.z.string(),
    byte_size: zod_1.z.number().int().positive(),
    sha256: zod_1.z.string().length(64),
    status: exports.DocumentStatusSchema,
    page_count: zod_1.z.number().int().nonnegative().nullable().optional(),
    storage_object_key: zod_1.z.string().nullable().optional(),
    scan_status: exports.ScanStatusSchema,
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
    deleted_at: zod_1.z.string().datetime().nullable().optional(),
});
exports.DocumentVersionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    document_id: zod_1.z.string().uuid(),
    version_number: zod_1.z.number().int().positive(),
    content_sha256: zod_1.z.string().length(64),
    extractor_version: zod_1.z.string(),
    language_code: zod_1.z.string().nullable().optional(),
    extraction_status: exports.ExtractionStatusSchema,
    created_at: zod_1.z.string().datetime(),
});
exports.DocumentChunkSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    document_version_id: zod_1.z.string().uuid(),
    chunk_index: zod_1.z.number().int().nonnegative(),
    text_content: zod_1.z.string(),
    page_start: zod_1.z.number().int().positive().nullable().optional(),
    page_end: zod_1.z.number().int().positive().nullable().optional(),
    section_title: zod_1.z.string().nullable().optional(),
    char_start: zod_1.z.number().int().nonnegative().nullable().optional(),
    char_end: zod_1.z.number().int().nonnegative().nullable().optional(),
    extraction_confidence: zod_1.z.number().min(0).max(1).nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).default({}),
    created_at: zod_1.z.string().datetime(),
});
exports.DocumentEmbeddingSchema = zod_1.z.object({
    chunk_id: zod_1.z.string().uuid(),
    embedding_model: zod_1.z.string(),
    embedding: zod_1.z.array(zod_1.z.number()),
    created_at: zod_1.z.string().datetime(),
});
exports.AnalysisSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    document_id: zod_1.z.string().uuid(),
    analysis_type: exports.AnalysisTypeSchema,
    model_provider: zod_1.z.string().nullable().optional(),
    model_name: zod_1.z.string().nullable().optional(),
    prompt_version: zod_1.z.string(),
    status: exports.AnalysisStatusSchema,
    result: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
    created_at: zod_1.z.string().datetime(),
    completed_at: zod_1.z.string().datetime().nullable().optional(),
});
exports.FindingCitationSchema = zod_1.z.object({
    finding_id: zod_1.z.string().uuid(),
    chunk_id: zod_1.z.string().uuid(),
});
exports.AnalysisFindingSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    analysis_id: zod_1.z.string().uuid(),
    finding_type: exports.FindingTypeSchema,
    confidence: exports.ConfidenceSchema.nullable().optional(),
    title: zod_1.z.string().min(1),
    explanation: zod_1.z.string().min(1),
    created_at: zod_1.z.string().datetime(),
    // Mandatory: at least one source chunk citation
    citation_chunk_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1),
});
exports.ConversationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    project_id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    title: zod_1.z.string().nullable().optional(),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
exports.MessageCitationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    message_id: zod_1.z.string().uuid(),
    chunk_id: zod_1.z.string().uuid(),
    relevance_score: zod_1.z.number().nullable().optional(),
    created_at: zod_1.z.string().datetime(),
});
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    conversation_id: zod_1.z.string().uuid(),
    role: exports.MessageRoleSchema,
    content: zod_1.z.string(),
    status: exports.MessageStatusSchema,
    model_name: zod_1.z.string().nullable().optional(),
    prompt_version: zod_1.z.string().nullable().optional(),
    created_at: zod_1.z.string().datetime(),
    citations: zod_1.z.array(exports.MessageCitationSchema).optional(),
});
exports.ComparisonSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    project_id: zod_1.z.string().uuid(),
    document_a_id: zod_1.z.string().uuid(),
    document_b_id: zod_1.z.string().uuid(),
    status: exports.ComparisonStatusSchema,
    model_name: zod_1.z.string().nullable().optional(),
    prompt_version: zod_1.z.string().nullable().optional(),
    summary: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
    created_at: zod_1.z.string().datetime(),
    completed_at: zod_1.z.string().datetime().nullable().optional(),
});
exports.ComparisonChangeCitationSchema = zod_1.z.object({
    change_id: zod_1.z.string().uuid(),
    chunk_id: zod_1.z.string().uuid(),
    source_side: exports.SourceSideSchema,
});
exports.ComparisonChangeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    comparison_id: zod_1.z.string().uuid(),
    change_type: exports.ChangeTypeSchema,
    materiality: exports.MaterialitySchema,
    title: zod_1.z.string().min(1),
    explanation: zod_1.z.string().min(1),
    old_text: zod_1.z.string().nullable().optional(),
    new_text: zod_1.z.string().nullable().optional(),
    created_at: zod_1.z.string().datetime(),
    citations: zod_1.z.array(exports.ComparisonChangeCitationSchema).min(1),
});
exports.LawyerPrepDraftSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    project_id: zod_1.z.string().uuid(),
    created_by_user_id: zod_1.z.string().uuid(),
    situation_summary: zod_1.z.string().nullable().optional(),
    key_clauses: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
    key_dates: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
    facts_still_needed: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
    questions_for_lawyer: zod_1.z.record(zod_1.z.unknown()).nullable().optional(),
    user_notes: zod_1.z.string().nullable().optional(),
    status: exports.LawyerPrepDraftStatusSchema,
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
exports.ExportSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    project_id: zod_1.z.string().uuid(),
    requested_by_user_id: zod_1.z.string().uuid(),
    export_source_type: exports.ExportSourceTypeSchema,
    format: exports.ExportFormatSchema,
    status: exports.ExportStatusSchema,
    storage_object_key: zod_1.z.string().nullable().optional(),
    expires_at: zod_1.z.string().datetime().nullable().optional(),
    created_at: zod_1.z.string().datetime(),
});
exports.AuditEventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    actor_user_id: zod_1.z.string().uuid().nullable().optional(),
    project_id: zod_1.z.string().uuid().nullable().optional(),
    event_type: zod_1.z.string().min(1),
    resource_type: zod_1.z.string().nullable().optional(),
    resource_id: zod_1.z.string().uuid().nullable().optional(),
    request_id: zod_1.z.string().nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).default({}),
    created_at: zod_1.z.string().datetime(),
});
exports.JobSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    job_type: zod_1.z.string().min(1),
    resource_type: zod_1.z.string().min(1),
    resource_id: zod_1.z.string().uuid(),
    status: exports.JobStatusSchema,
    attempts: zod_1.z.number().int().nonnegative().default(0),
    last_error_code: zod_1.z.string().nullable().optional(),
    created_at: zod_1.z.string().datetime(),
    started_at: zod_1.z.string().datetime().nullable().optional(),
    completed_at: zod_1.z.string().datetime().nullable().optional(),
});
//# sourceMappingURL=index.js.map