import { Router, Request, Response } from 'express';
import { loadConfig } from '../config';
import {
  globalEmbeddingProvider,
  globalLLMProvider,
  globalMalwareScanner,
  globalOCRProvider,
  globalStorage,
} from '../services/providers';

export const healthRouter = Router();

healthRouter.get(['/health', '/api/v1/health'], async (req: Request, res: Response) => {
  const config = loadConfig();

  const healthStatus = {
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    request_id: req.requestId,
    services: {
      api: { status: 'healthy' },
      ai_provider: {
        status: 'healthy',
        llm_model: globalLLMProvider.getModelName(),
        embedding_model: globalEmbeddingProvider.getModelName(),
        ocr_provider: globalOCRProvider.getProviderName(),
        malware_scanner: globalMalwareScanner.getScannerName(),
      },
      storage: {
        status: 'healthy',
        provider: globalStorage.getStorageProviderName(),
      },
      database: {
        status: config.DATA_STORE === 'postgres' ? 'configured' : 'mock_ready',
      },
    },
  };

  res.status(200).json(healthStatus);
});
