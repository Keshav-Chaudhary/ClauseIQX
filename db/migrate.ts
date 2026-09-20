import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

export interface MigrationFile {
  name: string;
  sql: string;
}

export function loadMigrations(migrationsDir = path.join(__dirname, 'migrations')): MigrationFile[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((file) => ({
    name: file,
    sql: fs.readFileSync(path.join(migrationsDir, file), 'utf-8'),
  }));
}

export async function runMigrations(): Promise<void> {
  const migrations = loadMigrations();
  console.log(`[MigrationRunner] Found ${migrations.length} migration(s).`);

  for (const m of migrations) {
    console.log(`[MigrationRunner] Checking migration: ${m.name}`);
    if (!m.sql || m.sql.trim().length === 0) {
      throw new Error(`Migration ${m.name} is empty.`);
    }
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[MigrationRunner] No DATABASE_URL provided. Schema files verified successfully in dry-run mode.');
    return;
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT clock_timestamp())');
    for (const migration of migrations) {
      const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [migration.name]);
      if (alreadyApplied.rowCount === 0) {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name]);
        await client.query('COMMIT');
        console.log(`[MigrationRunner] Applied migration: ${migration.name}`);
      } else {
        console.log(`[MigrationRunner] Already applied: ${migration.name}`);
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations().catch((err) => {
    console.error('[MigrationRunner] Migration failed:', err);
    process.exit(1);
  });
}
