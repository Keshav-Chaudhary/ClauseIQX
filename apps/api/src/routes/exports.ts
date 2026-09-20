import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, authorizeProject } from '../middleware/auth';
import { dataStore } from '../services/store';
import { createExportJob } from '../services/exports';
import { globalStorage } from '../services/providers';
import { createNotFoundOrForbiddenError, createValidationError } from '@clauseiqx/security';
import { ExportFormatSchema, ExportSourceTypeSchema } from '@clauseiqx/shared-types';
import { z } from 'zod';

export const exportsRouter = Router({ mergeParams: true });

const CreateExportBodySchema = z.object({
  exportSourceType: ExportSourceTypeSchema,
  format: ExportFormatSchema,
});

/**
 * POST /api/v1/projects/:projectId/exports
 * Generates an export with disclaimer, timestamp, and short-lived authorized URL.
 */
exportsRouter.post(
  '/',
  requireAuth,
  authorizeProject('member'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawProjectId = req.params.projectId;
      const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

      const parsed = CreateExportBodySchema.safeParse(req.body);
      if (!parsed.success) {
        const err = createValidationError(
          `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
          req.requestId
        );
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const result = await createExportJob({
        projectId,
        userId: req.user!.id,
        exportSourceType: parsed.data.exportSourceType,
        format: parsed.data.format,
      });

      const downloadUrl = `/api/v1/projects/${projectId}/exports/${result.exportRecord.id}/download`;

      res.status(201).json({
        export: result.exportRecord,
        download_url: downloadUrl,
        storage_url: result.downloadUrl,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/exports
 * Lists all exports in the project.
 */
exportsRouter.get(
  '/',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    const exportsList = dataStore.findExportsForProject(projectId);
    res.json({ exports: exportsList });
  }
);

/**
 * GET /api/v1/projects/:projectId/exports/:exportId
 * Gets metadata for a specific export.
 */
exportsRouter.get(
  '/:exportId',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response): Promise<void> => {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawExportId = req.params.exportId;
    const exportId = Array.isArray(rawExportId) ? rawExportId[0] : rawExportId;

    const exp = dataStore.findExportById(exportId);
    if (!exp || exp.project_id !== projectId) {
      const err = createNotFoundOrForbiddenError('Export', req.requestId);
      res.status(err.statusCode).json(err.payload);
      return;
    }

    res.json({ export: exp });
  }
);

/**
 * GET /api/v1/projects/:projectId/exports/:exportId/download
 * Authenticated download endpoint that validates expiration and streams the private export artifact.
 */
exportsRouter.get(
  '/:exportId/download',
  requireAuth,
  authorizeProject('viewer'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawProjectId = req.params.projectId;
      const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
      const rawExportId = req.params.exportId;
      const exportId = Array.isArray(rawExportId) ? rawExportId[0] : rawExportId;

      const exp = dataStore.findExportById(exportId);
      if (!exp || exp.project_id !== projectId) {
        const err = createNotFoundOrForbiddenError('Export', req.requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }

      // Check if export is expired
      if (exp.expires_at && new Date(exp.expires_at).getTime() < Date.now()) {
        const err = createValidationError('This export download link has expired. Please generate a new export.', req.requestId);
        res.status(410).json(err.payload);
        return;
      }

      if (!exp.storage_object_key) {
        const err = createNotFoundOrForbiddenError('Export', req.requestId);
        res.status(err.statusCode).json(err.payload);
        return;
      }

      const fileBuffer = await globalStorage.get(exp.storage_object_key);
      const filename = `ClauseIQX_${exp.export_source_type}_${exportId.substring(0, 8)}.${exp.format}`;

      const contentTypes: Record<string, string> = {
        markdown: 'text/markdown; charset=utf-8',
        ics: 'text/calendar; charset=utf-8',
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentTypes[exp.format] || 'application/octet-stream');
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }
);
