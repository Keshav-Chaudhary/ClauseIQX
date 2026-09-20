import { z } from 'zod';
export declare const UserRoleSchema: z.ZodEnum<["owner", "member", "viewer"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export declare const DocumentStatusSchema: z.ZodEnum<["UPLOADING", "QUARANTINED", "SCANNING", "PROCESSING", "READY", "FAILED", "DELETED"]>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export declare const ScanStatusSchema: z.ZodEnum<["PENDING", "CLEAN", "INFECTED", "FAILED"]>;
export type ScanStatus = z.infer<typeof ScanStatusSchema>;
export declare const ExtractionStatusSchema: z.ZodEnum<["pending", "extracting", "completed", "failed"]>;
export type ExtractionStatus = z.infer<typeof ExtractionStatusSchema>;
export declare const AnalysisTypeSchema: z.ZodEnum<["summary", "clauses", "review_points", "dates", "lawyer_prep"]>;
export type AnalysisType = z.infer<typeof AnalysisTypeSchema>;
export declare const AnalysisStatusSchema: z.ZodEnum<["pending", "processing", "ready", "incomplete", "failed"]>;
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;
export declare const FindingTypeSchema: z.ZodEnum<["obligation", "right", "date", "fee", "termination", "liability", "indemnity", "privacy", "dispute", "inconsistency", "review_point"]>;
export type FindingType = z.infer<typeof FindingTypeSchema>;
export declare const ConfidenceSchema: z.ZodEnum<["high", "medium", "low"]>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export declare const MessageRoleSchema: z.ZodEnum<["user", "assistant", "system_metadata"]>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;
export declare const MessageStatusSchema: z.ZodEnum<["sent", "processing", "delivered", "abstained", "failed"]>;
export type MessageStatus = z.infer<typeof MessageStatusSchema>;
export declare const ComparisonStatusSchema: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
export type ComparisonStatus = z.infer<typeof ComparisonStatusSchema>;
export declare const ChangeTypeSchema: z.ZodEnum<["added", "removed", "modified", "reordered", "paraphrased"]>;
export type ChangeType = z.infer<typeof ChangeTypeSchema>;
export declare const MaterialitySchema: z.ZodEnum<["material", "minor", "formatting_only"]>;
export type Materiality = z.infer<typeof MaterialitySchema>;
export declare const SourceSideSchema: z.ZodEnum<["a", "b"]>;
export type SourceSide = z.infer<typeof SourceSideSchema>;
export declare const LawyerPrepDraftStatusSchema: z.ZodEnum<["draft", "finalized"]>;
export type LawyerPrepDraftStatus = z.infer<typeof LawyerPrepDraftStatusSchema>;
export declare const ExportFormatSchema: z.ZodEnum<["pdf", "docx", "markdown", "ics"]>;
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export declare const ExportSourceTypeSchema: z.ZodEnum<["summary", "comparison", "lawyer_prep"]>;
export type ExportSourceType = z.infer<typeof ExportSourceTypeSchema>;
export declare const ExportStatusSchema: z.ZodEnum<["queued", "processing", "completed", "failed"]>;
export type ExportStatus = z.infer<typeof ExportStatusSchema>;
export declare const JobStatusSchema: z.ZodEnum<["QUEUED", "RUNNING", "SUCCEEDED", "FAILED_RETRYABLE", "FAILED", "CANCELLED"]>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export declare const ApiErrorSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        request_id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        request_id: string;
    }, {
        message: string;
        code: string;
        request_id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        code: string;
        request_id: string;
    };
}, {
    error: {
        message: string;
        code: string;
        request_id: string;
    };
}>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    display_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    auth_provider: z.ZodString;
    status: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    id: string;
    email: string;
    auth_provider: string;
    created_at: string;
    updated_at: string;
    display_name?: string | null | undefined;
}, {
    status: string;
    id: string;
    email: string;
    auth_provider: string;
    created_at: string;
    updated_at: string;
    display_name?: string | null | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    owner_user_id: z.ZodString;
    name: z.ZodString;
    jurisdiction_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    document_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
    deleted_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: string;
    id: string;
    created_at: string;
    updated_at: string;
    owner_user_id: string;
    jurisdiction_code?: string | null | undefined;
    document_type?: string | null | undefined;
    deleted_at?: string | null | undefined;
}, {
    name: string;
    status: string;
    id: string;
    created_at: string;
    updated_at: string;
    owner_user_id: string;
    jurisdiction_code?: string | null | undefined;
    document_type?: string | null | undefined;
    deleted_at?: string | null | undefined;
}>;
export type Project = z.infer<typeof ProjectSchema>;
export declare const ProjectMemberSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    user_id: z.ZodString;
    role: z.ZodEnum<["owner", "member", "viewer"]>;
    invited_at: z.ZodString;
    accepted_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    project_id: string;
    user_id: string;
    role: "owner" | "member" | "viewer";
    invited_at: string;
    accepted_at?: string | null | undefined;
}, {
    id: string;
    project_id: string;
    user_id: string;
    role: "owner" | "member" | "viewer";
    invited_at: string;
    accepted_at?: string | null | undefined;
}>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export declare const DocumentSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    uploaded_by_user_id: z.ZodString;
    filename: z.ZodString;
    media_type: z.ZodString;
    byte_size: z.ZodNumber;
    sha256: z.ZodString;
    status: z.ZodEnum<["UPLOADING", "QUARANTINED", "SCANNING", "PROCESSING", "READY", "FAILED", "DELETED"]>;
    page_count: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    storage_object_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    scan_status: z.ZodEnum<["PENDING", "CLEAN", "INFECTED", "FAILED"]>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
    deleted_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "UPLOADING" | "QUARANTINED" | "SCANNING" | "PROCESSING" | "READY" | "FAILED" | "DELETED";
    id: string;
    created_at: string;
    updated_at: string;
    project_id: string;
    uploaded_by_user_id: string;
    filename: string;
    media_type: string;
    byte_size: number;
    sha256: string;
    scan_status: "FAILED" | "PENDING" | "CLEAN" | "INFECTED";
    deleted_at?: string | null | undefined;
    page_count?: number | null | undefined;
    storage_object_key?: string | null | undefined;
}, {
    status: "UPLOADING" | "QUARANTINED" | "SCANNING" | "PROCESSING" | "READY" | "FAILED" | "DELETED";
    id: string;
    created_at: string;
    updated_at: string;
    project_id: string;
    uploaded_by_user_id: string;
    filename: string;
    media_type: string;
    byte_size: number;
    sha256: string;
    scan_status: "FAILED" | "PENDING" | "CLEAN" | "INFECTED";
    deleted_at?: string | null | undefined;
    page_count?: number | null | undefined;
    storage_object_key?: string | null | undefined;
}>;
export type Document = z.infer<typeof DocumentSchema>;
export declare const DocumentVersionSchema: z.ZodObject<{
    id: z.ZodString;
    document_id: z.ZodString;
    version_number: z.ZodNumber;
    content_sha256: z.ZodString;
    extractor_version: z.ZodString;
    language_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    extraction_status: z.ZodEnum<["pending", "extracting", "completed", "failed"]>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    document_id: string;
    version_number: number;
    content_sha256: string;
    extractor_version: string;
    extraction_status: "pending" | "extracting" | "completed" | "failed";
    language_code?: string | null | undefined;
}, {
    id: string;
    created_at: string;
    document_id: string;
    version_number: number;
    content_sha256: string;
    extractor_version: string;
    extraction_status: "pending" | "extracting" | "completed" | "failed";
    language_code?: string | null | undefined;
}>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export declare const DocumentChunkSchema: z.ZodObject<{
    id: z.ZodString;
    document_version_id: z.ZodString;
    chunk_index: z.ZodNumber;
    text_content: z.ZodString;
    page_start: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    page_end: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    section_title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    char_start: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    char_end: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    extraction_confidence: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text_content: string;
    id: string;
    created_at: string;
    document_version_id: string;
    chunk_index: number;
    metadata: Record<string, unknown>;
    page_start?: number | null | undefined;
    page_end?: number | null | undefined;
    section_title?: string | null | undefined;
    char_start?: number | null | undefined;
    char_end?: number | null | undefined;
    extraction_confidence?: number | null | undefined;
}, {
    text_content: string;
    id: string;
    created_at: string;
    document_version_id: string;
    chunk_index: number;
    page_start?: number | null | undefined;
    page_end?: number | null | undefined;
    section_title?: string | null | undefined;
    char_start?: number | null | undefined;
    char_end?: number | null | undefined;
    extraction_confidence?: number | null | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;
export declare const DocumentEmbeddingSchema: z.ZodObject<{
    chunk_id: z.ZodString;
    embedding_model: z.ZodString;
    embedding: z.ZodArray<z.ZodNumber, "many">;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    created_at: string;
    chunk_id: string;
    embedding_model: string;
    embedding: number[];
}, {
    created_at: string;
    chunk_id: string;
    embedding_model: string;
    embedding: number[];
}>;
export type DocumentEmbedding = z.infer<typeof DocumentEmbeddingSchema>;
export declare const AnalysisSchema: z.ZodObject<{
    id: z.ZodString;
    document_id: z.ZodString;
    analysis_type: z.ZodEnum<["summary", "clauses", "review_points", "dates", "lawyer_prep"]>;
    model_provider: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    model_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    prompt_version: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "ready", "incomplete", "failed"]>;
    result: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    created_at: z.ZodString;
    completed_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "failed" | "processing" | "ready" | "incomplete";
    id: string;
    created_at: string;
    document_id: string;
    analysis_type: "summary" | "clauses" | "review_points" | "dates" | "lawyer_prep";
    prompt_version: string;
    model_provider?: string | null | undefined;
    model_name?: string | null | undefined;
    result?: Record<string, unknown> | null | undefined;
    completed_at?: string | null | undefined;
}, {
    status: "pending" | "failed" | "processing" | "ready" | "incomplete";
    id: string;
    created_at: string;
    document_id: string;
    analysis_type: "summary" | "clauses" | "review_points" | "dates" | "lawyer_prep";
    prompt_version: string;
    model_provider?: string | null | undefined;
    model_name?: string | null | undefined;
    result?: Record<string, unknown> | null | undefined;
    completed_at?: string | null | undefined;
}>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export declare const FindingCitationSchema: z.ZodObject<{
    finding_id: z.ZodString;
    chunk_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    chunk_id: string;
    finding_id: string;
}, {
    chunk_id: string;
    finding_id: string;
}>;
export type FindingCitation = z.infer<typeof FindingCitationSchema>;
export declare const AnalysisFindingSchema: z.ZodObject<{
    id: z.ZodString;
    analysis_id: z.ZodString;
    finding_type: z.ZodEnum<["obligation", "right", "date", "fee", "termination", "liability", "indemnity", "privacy", "dispute", "inconsistency", "review_point"]>;
    confidence: z.ZodOptional<z.ZodNullable<z.ZodEnum<["high", "medium", "low"]>>>;
    title: z.ZodString;
    explanation: z.ZodString;
    created_at: z.ZodString;
    citation_chunk_ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    analysis_id: string;
    finding_type: "obligation" | "right" | "date" | "fee" | "termination" | "liability" | "indemnity" | "privacy" | "dispute" | "inconsistency" | "review_point";
    title: string;
    explanation: string;
    citation_chunk_ids: string[];
    confidence?: "high" | "medium" | "low" | null | undefined;
}, {
    id: string;
    created_at: string;
    analysis_id: string;
    finding_type: "obligation" | "right" | "date" | "fee" | "termination" | "liability" | "indemnity" | "privacy" | "dispute" | "inconsistency" | "review_point";
    title: string;
    explanation: string;
    citation_chunk_ids: string[];
    confidence?: "high" | "medium" | "low" | null | undefined;
}>;
export type AnalysisFinding = z.infer<typeof AnalysisFindingSchema>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    user_id: z.ZodString;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    project_id: string;
    user_id: string;
    title?: string | null | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    project_id: string;
    user_id: string;
    title?: string | null | undefined;
}>;
export type Conversation = z.infer<typeof ConversationSchema>;
export declare const MessageCitationSchema: z.ZodObject<{
    id: z.ZodString;
    message_id: z.ZodString;
    chunk_id: z.ZodString;
    relevance_score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    chunk_id: string;
    message_id: string;
    relevance_score?: number | null | undefined;
}, {
    id: string;
    created_at: string;
    chunk_id: string;
    message_id: string;
    relevance_score?: number | null | undefined;
}>;
export type MessageCitation = z.infer<typeof MessageCitationSchema>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    conversation_id: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "system_metadata"]>;
    content: z.ZodString;
    status: z.ZodEnum<["sent", "processing", "delivered", "abstained", "failed"]>;
    model_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    prompt_version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    citations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        message_id: z.ZodString;
        chunk_id: z.ZodString;
        relevance_score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        created_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        chunk_id: string;
        message_id: string;
        relevance_score?: number | null | undefined;
    }, {
        id: string;
        created_at: string;
        chunk_id: string;
        message_id: string;
        relevance_score?: number | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "failed" | "processing" | "sent" | "delivered" | "abstained";
    id: string;
    created_at: string;
    role: "user" | "assistant" | "system_metadata";
    conversation_id: string;
    content: string;
    model_name?: string | null | undefined;
    prompt_version?: string | null | undefined;
    citations?: {
        id: string;
        created_at: string;
        chunk_id: string;
        message_id: string;
        relevance_score?: number | null | undefined;
    }[] | undefined;
}, {
    status: "failed" | "processing" | "sent" | "delivered" | "abstained";
    id: string;
    created_at: string;
    role: "user" | "assistant" | "system_metadata";
    conversation_id: string;
    content: string;
    model_name?: string | null | undefined;
    prompt_version?: string | null | undefined;
    citations?: {
        id: string;
        created_at: string;
        chunk_id: string;
        message_id: string;
        relevance_score?: number | null | undefined;
    }[] | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const ComparisonSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    document_a_id: z.ZodString;
    document_b_id: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
    model_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    prompt_version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    summary: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    created_at: z.ZodString;
    completed_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "completed" | "failed" | "processing";
    id: string;
    created_at: string;
    project_id: string;
    document_a_id: string;
    document_b_id: string;
    summary?: Record<string, unknown> | null | undefined;
    model_name?: string | null | undefined;
    prompt_version?: string | null | undefined;
    completed_at?: string | null | undefined;
}, {
    status: "pending" | "completed" | "failed" | "processing";
    id: string;
    created_at: string;
    project_id: string;
    document_a_id: string;
    document_b_id: string;
    summary?: Record<string, unknown> | null | undefined;
    model_name?: string | null | undefined;
    prompt_version?: string | null | undefined;
    completed_at?: string | null | undefined;
}>;
export type Comparison = z.infer<typeof ComparisonSchema>;
export declare const ComparisonChangeCitationSchema: z.ZodObject<{
    change_id: z.ZodString;
    chunk_id: z.ZodString;
    source_side: z.ZodEnum<["a", "b"]>;
}, "strip", z.ZodTypeAny, {
    chunk_id: string;
    change_id: string;
    source_side: "a" | "b";
}, {
    chunk_id: string;
    change_id: string;
    source_side: "a" | "b";
}>;
export type ComparisonChangeCitation = z.infer<typeof ComparisonChangeCitationSchema>;
export declare const ComparisonChangeSchema: z.ZodObject<{
    id: z.ZodString;
    comparison_id: z.ZodString;
    change_type: z.ZodEnum<["added", "removed", "modified", "reordered", "paraphrased"]>;
    materiality: z.ZodEnum<["material", "minor", "formatting_only"]>;
    title: z.ZodString;
    explanation: z.ZodString;
    old_text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    new_text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    citations: z.ZodArray<z.ZodObject<{
        change_id: z.ZodString;
        chunk_id: z.ZodString;
        source_side: z.ZodEnum<["a", "b"]>;
    }, "strip", z.ZodTypeAny, {
        chunk_id: string;
        change_id: string;
        source_side: "a" | "b";
    }, {
        chunk_id: string;
        change_id: string;
        source_side: "a" | "b";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    title: string;
    explanation: string;
    citations: {
        chunk_id: string;
        change_id: string;
        source_side: "a" | "b";
    }[];
    comparison_id: string;
    change_type: "added" | "removed" | "modified" | "reordered" | "paraphrased";
    materiality: "material" | "minor" | "formatting_only";
    old_text?: string | null | undefined;
    new_text?: string | null | undefined;
}, {
    id: string;
    created_at: string;
    title: string;
    explanation: string;
    citations: {
        chunk_id: string;
        change_id: string;
        source_side: "a" | "b";
    }[];
    comparison_id: string;
    change_type: "added" | "removed" | "modified" | "reordered" | "paraphrased";
    materiality: "material" | "minor" | "formatting_only";
    old_text?: string | null | undefined;
    new_text?: string | null | undefined;
}>;
export type ComparisonChange = z.infer<typeof ComparisonChangeSchema>;
export declare const LawyerPrepDraftSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    created_by_user_id: z.ZodString;
    situation_summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    key_clauses: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    key_dates: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    facts_still_needed: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    questions_for_lawyer: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    user_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<["draft", "finalized"]>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "finalized";
    id: string;
    created_at: string;
    updated_at: string;
    project_id: string;
    created_by_user_id: string;
    situation_summary?: string | null | undefined;
    key_clauses?: Record<string, unknown> | null | undefined;
    key_dates?: Record<string, unknown> | null | undefined;
    facts_still_needed?: Record<string, unknown> | null | undefined;
    questions_for_lawyer?: Record<string, unknown> | null | undefined;
    user_notes?: string | null | undefined;
}, {
    status: "draft" | "finalized";
    id: string;
    created_at: string;
    updated_at: string;
    project_id: string;
    created_by_user_id: string;
    situation_summary?: string | null | undefined;
    key_clauses?: Record<string, unknown> | null | undefined;
    key_dates?: Record<string, unknown> | null | undefined;
    facts_still_needed?: Record<string, unknown> | null | undefined;
    questions_for_lawyer?: Record<string, unknown> | null | undefined;
    user_notes?: string | null | undefined;
}>;
export type LawyerPrepDraft = z.infer<typeof LawyerPrepDraftSchema>;
export declare const ExportSchema: z.ZodObject<{
    id: z.ZodString;
    project_id: z.ZodString;
    requested_by_user_id: z.ZodString;
    export_source_type: z.ZodEnum<["summary", "comparison", "lawyer_prep"]>;
    format: z.ZodEnum<["pdf", "docx", "markdown", "ics"]>;
    status: z.ZodEnum<["queued", "processing", "completed", "failed"]>;
    storage_object_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "failed" | "processing" | "queued";
    id: string;
    created_at: string;
    project_id: string;
    requested_by_user_id: string;
    export_source_type: "summary" | "lawyer_prep" | "comparison";
    format: "pdf" | "docx" | "markdown" | "ics";
    storage_object_key?: string | null | undefined;
    expires_at?: string | null | undefined;
}, {
    status: "completed" | "failed" | "processing" | "queued";
    id: string;
    created_at: string;
    project_id: string;
    requested_by_user_id: string;
    export_source_type: "summary" | "lawyer_prep" | "comparison";
    format: "pdf" | "docx" | "markdown" | "ics";
    storage_object_key?: string | null | undefined;
    expires_at?: string | null | undefined;
}>;
export type Export = z.infer<typeof ExportSchema>;
export declare const AuditEventSchema: z.ZodObject<{
    id: z.ZodString;
    actor_user_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    project_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    event_type: z.ZodString;
    resource_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    resource_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    request_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    metadata: Record<string, unknown>;
    event_type: string;
    request_id?: string | null | undefined;
    project_id?: string | null | undefined;
    actor_user_id?: string | null | undefined;
    resource_type?: string | null | undefined;
    resource_id?: string | null | undefined;
}, {
    id: string;
    created_at: string;
    event_type: string;
    request_id?: string | null | undefined;
    project_id?: string | null | undefined;
    metadata?: Record<string, unknown> | undefined;
    actor_user_id?: string | null | undefined;
    resource_type?: string | null | undefined;
    resource_id?: string | null | undefined;
}>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export declare const JobSchema: z.ZodObject<{
    id: z.ZodString;
    job_type: z.ZodString;
    resource_type: z.ZodString;
    resource_id: z.ZodString;
    status: z.ZodEnum<["QUEUED", "RUNNING", "SUCCEEDED", "FAILED_RETRYABLE", "FAILED", "CANCELLED"]>;
    attempts: z.ZodDefault<z.ZodNumber>;
    last_error_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    started_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completed_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "FAILED" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED_RETRYABLE" | "CANCELLED";
    id: string;
    created_at: string;
    resource_type: string;
    resource_id: string;
    job_type: string;
    attempts: number;
    completed_at?: string | null | undefined;
    last_error_code?: string | null | undefined;
    started_at?: string | null | undefined;
}, {
    status: "FAILED" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED_RETRYABLE" | "CANCELLED";
    id: string;
    created_at: string;
    resource_type: string;
    resource_id: string;
    job_type: string;
    completed_at?: string | null | undefined;
    attempts?: number | undefined;
    last_error_code?: string | null | undefined;
    started_at?: string | null | undefined;
}>;
export type Job = z.infer<typeof JobSchema>;
//# sourceMappingURL=index.d.ts.map