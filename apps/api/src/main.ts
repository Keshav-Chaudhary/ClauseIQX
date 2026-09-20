import { createApp } from './app';
import { loadConfig } from './config';
import { defaultLogger } from '@clauseiqx/logger';
import { dataStore, PostgresDataStore } from './services/store';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  if (dataStore instanceof PostgresDataStore) {
    await dataStore.initialize();
  }
  const app = createApp();

  const server = app.listen(config.PORT, () => {
    defaultLogger.info(`ClauseIQX API server running on port ${config.PORT}`, {
      port: config.PORT,
      env: config.NODE_ENV,
    });
  });

  const shutdown = (): void => {
    defaultLogger.info('Shutting down server gracefully...');
    server.close(() => {
      defaultLogger.info('Server shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  bootstrap().catch((error: unknown) => {
    console.error('[Bootstrap] Failed to initialize API:', error);
    process.exit(1);
  });
}
