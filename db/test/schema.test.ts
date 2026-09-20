import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Schema & Migration Validation (05_Backend_Schema.md)', () => {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const expectedTables = [
    'users',
    'projects',
    'project_members',
    'documents',
    'document_versions',
    'document_chunks',
    'document_embeddings',
    'analyses',
    'analysis_findings',
    'finding_citations',
    'conversations',
    'messages',
    'message_citations',
    'comparisons',
    'comparison_changes',
    'comparison_change_citations',
    'lawyer_prep_drafts',
    'exports',
    'audit_events',
    'jobs',
  ];

  expectedTables.forEach((tableName) => {
    it(`defines table: ${tableName}`, () => {
      const tableRegex = new RegExp(`CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${tableName}\\b`, 'i');
      expect(sql).toMatch(tableRegex);
    });
  });

  it('enforces mandatory finding_citations table with primary key (finding_id, chunk_id)', () => {
    expect(sql).toContain('PRIMARY KEY (finding_id, chunk_id)');
  });

  it('uses strictly "review_point" terminology and avoids risk flags/severity language', () => {
    expect(sql).toContain("'review_point'");
    expect(sql.toLowerCase()).not.toContain('risk_flag');
    expect(sql.toLowerCase()).not.toContain('risk_level');
  });

  it('enforces comparison constraint checking document_a_id <> document_b_id', () => {
    expect(sql).toContain('document_a_id <> document_b_id');
  });

  it('includes required performance indexes from 05_Backend_Schema.md §18', () => {
    expect(sql).toContain('idx_projects_owner_created');
    expect(sql).toContain('idx_documents_project_created');
    expect(sql).toContain('idx_document_chunks_version_index');
    expect(sql).toContain('idx_analyses_document_created');
    expect(sql).toContain('idx_conversations_project_updated');
    expect(sql).toContain('idx_messages_conversation_created');
    expect(sql).toContain('idx_comparisons_project_created');
  });
});
