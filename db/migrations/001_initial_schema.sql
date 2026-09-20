-- =========================================================
-- ClauseIQX - Initial Schema Migration
-- Matches 05_Backend_Schema.md exactly
-- =========================================================

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email citext UNIQUE NOT NULL,
  display_name text,
  auth_provider text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 2. Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  jurisdiction_code text, -- null / 'unknown' if user skips, never guessed
  document_type text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_projects_owner_created ON projects(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_owner_status ON projects(owner_user_id, status);

-- 3. Project Members
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
  invited_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  accepted_at timestamptz,
  UNIQUE(project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_lookup ON project_members(project_id, user_id);

-- 4. Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by_user_id uuid NOT NULL REFERENCES users(id),
  filename text NOT NULL,
  media_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  sha256 text NOT NULL,
  status text NOT NULL CHECK (status IN ('UPLOADING', 'QUARANTINED', 'SCANNING', 'PROCESSING', 'READY', 'FAILED', 'DELETED')),
  page_count integer CHECK (page_count >= 0),
  storage_object_key text,
  scan_status text NOT NULL CHECK (scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_documents_project_created ON documents(project_id, created_at DESC);

-- 5. Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  content_sha256 text NOT NULL,
  extractor_version text NOT NULL,
  language_code text,
  extraction_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(document_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_document_versions_lookup ON document_versions(document_id, version_number);

-- 6. Document Chunks
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  text_content text NOT NULL,
  page_start integer,
  page_end integer,
  section_title text,
  char_start integer,
  char_end integer,
  extraction_confidence numeric(5,4),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(document_version_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_document_chunks_version_index ON document_chunks(document_version_id, chunk_index);

-- 7. Embeddings (supports multiple models without mutating chunk provenance)
CREATE TABLE IF NOT EXISTS document_embeddings (
  chunk_id uuid NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding_model text NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (chunk_id, embedding_model)
);

-- 8. Analyses
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  analysis_type text NOT NULL,
  model_provider text,
  model_name text,
  prompt_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'ready', 'incomplete', 'failed')),
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_analyses_document_created ON analyses(document_id, created_at DESC);

-- 9. Analysis Findings (Notice: strictly finding_type, never severity/risk flags)
CREATE TABLE IF NOT EXISTS analysis_findings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  finding_type text NOT NULL CHECK (finding_type IN (
    'obligation', 'right', 'date', 'fee', 'termination',
    'liability', 'indemnity', 'privacy', 'dispute',
    'inconsistency', 'review_point'
  )),
  confidence text CHECK (confidence IN ('high', 'medium', 'low')),
  title text NOT NULL,
  explanation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 10. Finding Citations (MANDATORY provenance: every finding must link to >= 1 source chunk)
CREATE TABLE IF NOT EXISTS finding_citations (
  finding_id uuid NOT NULL REFERENCES analysis_findings(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  PRIMARY KEY (finding_id, chunk_id)
);

-- 11. Conversations & Messages
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_conversations_project_updated ON conversations(project_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system_metadata')),
  content text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'processing', 'delivered', 'abstained', 'failed')),
  model_name text,
  prompt_version text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS message_citations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  relevance_score numeric,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 12. Comparisons
CREATE TABLE IF NOT EXISTS comparisons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_a_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_b_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  model_name text,
  prompt_version text,
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  completed_at timestamptz,
  CHECK (document_a_id <> document_b_id)
);
CREATE INDEX IF NOT EXISTS idx_comparisons_project_created ON comparisons(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comparison_changes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comparison_id uuid NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('added', 'removed', 'modified', 'reordered', 'paraphrased')),
  materiality text NOT NULL CHECK (materiality IN ('material', 'minor', 'formatting_only')),
  title text NOT NULL,
  explanation text NOT NULL,
  old_text text,
  new_text text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS comparison_change_citations (
  change_id uuid NOT NULL REFERENCES comparison_changes(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  source_side text NOT NULL CHECK (source_side IN ('a', 'b')),
  PRIMARY KEY (change_id, chunk_id, source_side)
);

-- 13. Lawyer Prep Drafts
CREATE TABLE IF NOT EXISTS lawyer_prep_drafts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  situation_summary text,
  key_clauses jsonb,
  key_dates jsonb,
  facts_still_needed jsonb,
  questions_for_lawyer jsonb,
  user_notes text,
  status text NOT NULL CHECK (status IN ('draft', 'finalized')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 14. Exports
CREATE TABLE IF NOT EXISTS exports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  export_source_type text NOT NULL CHECK (export_source_type IN ('summary', 'comparison', 'lawyer_prep')),
  format text NOT NULL CHECK (format IN ('pdf', 'docx', 'markdown', 'ics')),
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  storage_object_key text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 15. Audit Events (Append-only)
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  resource_type text,
  resource_id uuid,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_project_created ON audit_events(project_id, created_at DESC);

-- 16. Background Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED_RETRYABLE', 'FAILED', 'CANCELLED')),
  attempts integer NOT NULL DEFAULT 0,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  started_at timestamptz,
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at ASC);
