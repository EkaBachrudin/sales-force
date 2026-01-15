import { Pool } from 'pg';
import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  id: string;
  name: string;
  filename: string;
  executed_at?: Date;
}

// Migration table schema
const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, '../migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure migrations run in order

  return files;
}

/**
 * Create the schema_migrations table if it doesn't exist
 */
async function createMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(MIGRATIONS_TABLE);
  console.log('✓ Migrations table ready');
}

/**
 * Get all executed migrations from the database
 */
async function getExecutedMigrations(pool: Pool): Promise<Map<string, Migration>> {
  const result = await pool.query<Migration>(
    'SELECT name, filename, executed_at FROM schema_migrations ORDER BY id'
  );

  const migrations = new Map<string, Migration>();
  result.rows.forEach(row => {
    migrations.set(row.filename, row);
  });

  return migrations;
}

/**
 * Read and parse SQL file content
 */
function readMigrationFile(filename: string): string {
  const filePath = path.join(__dirname, '../migrations', filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Extract migration name from SQL file content
 */
function extractMigrationName(sql: string, filename: string): string {
  const match = sql.match(/-- Migration: (.+)/);
  return match?.[1] || filename.replace('.sql', '');
}

/**
 * Execute a single migration
 */
async function executeMigration(pool: Pool, filename: string, sql: string): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Execute the migration SQL
    await client.query(sql);

    // Record the migration
    const name = extractMigrationName(sql, filename);
    await client.query(
      'INSERT INTO schema_migrations (name, filename) VALUES ($1, $2)',
      [name, filename]
    );

    await client.query('COMMIT');
    console.log(`  ✓ Executed: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`  ✗ Failed: ${filename}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...\n');

  try {
    // Ensure migrations table exists
    await createMigrationsTable(pool);

    // Get migration files
    const files = getMigrationFiles();
    console.log(`Found ${files.length} migration file(s)\n`);

    if (files.length === 0) {
      console.log('No migrations to run.');
      return;
    }

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations(pool);

    // Filter pending migrations
    const pendingMigrations = files.filter(file => !executedMigrations.has(file));

    if (pendingMigrations.length === 0) {
      console.log('Database is up to date. No pending migrations.');
      return;
    }

    console.log(`Running ${pendingMigrations.length} pending migration(s):\n`);

    // Execute pending migrations
    for (const file of pendingMigrations) {
      const sql = readMigrationFile(file);
      await executeMigration(pool, file, sql);
    }

    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Show migration status
 */
export async function showMigrationStatus(): Promise<void> {
  console.log('Migration Status:\n');

  try {
    await createMigrationsTable(pool);

    const files = getMigrationFiles();
    const executedMigrations = await getExecutedMigrations(pool);

    console.log('Status:'.padEnd(12) + 'Migration File:');
    console.log('-'.repeat(50));

    for (const file of files) {
      const executed = executedMigrations.has(file);
      const status = executed ? 'Executed' : 'Pending';
      const executedAt = executedMigrations.get(file)?.executed_at;
      const timestamp = executedAt ? new Date(executedAt).toLocaleString() : '';

      console.log(
        `${status.padEnd(12)} ${file.padEnd(30)} ${timestamp}`
      );
    }

    const pendingCount = files.filter(f => !executedMigrations.has(f)).length;
    console.log('-'.repeat(50));
    console.log(`Total: ${files.length} migrations, ${pendingCount} pending\n`);
  } catch (error) {
    console.error('Error getting migration status:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Rollback last migration (use with caution)
 */
export async function rollbackMigration(): Promise<void> {
  console.log('Rolling back last migration...\n');

  try {
    await createMigrationsTable(pool);

    // Get the last executed migration
    const result = await pool.query<Migration>(
      'SELECT filename FROM schema_migrations ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback.');
      return;
    }

    const lastMigration = result.rows[0];
    if (lastMigration) {
      console.log(`Rolling back: ${lastMigration.filename}`);
      console.log('\n⚠️  WARNING: Automatic rollback is not implemented.');
      console.log('⚠️  You need to manually write and execute the rollback SQL.');
      console.log('⚠️  To remove this migration from the tracking table, run:');
      console.log(`   DELETE FROM schema_migrations WHERE filename = '${lastMigration.filename}';\n`);
    }
  } catch (error) {
    console.error('Error during rollback:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'run';

  switch (command) {
    case 'run':
      runMigrations().catch(() => process.exit(1));
      break;
    case 'status':
      showMigrationStatus().catch(() => process.exit(1));
      break;
    case 'rollback':
      rollbackMigration().catch(() => process.exit(1));
      break;
    default:
      console.log('Usage:');
      console.log('  npm run db:migrate          Run pending migrations');
      console.log('  npm run db:migrate status   Show migration status');
      console.log('  npm run db:migrate rollback Rollback last migration');
      process.exit(1);
  }
}
