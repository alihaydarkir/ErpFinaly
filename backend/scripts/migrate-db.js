const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const migrationsDir = path.join(__dirname, '../migrations');

// Calculate checksum for migration file
const calculateChecksum = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};

// Check if schema_migrations table exists and create if needed
const ensureMigrationsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64),
      execution_time_ms INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_migrations_name ON schema_migrations(migration_name);
  `;
  await pool.query(createTableSQL);
};

// Get list of already executed migrations
const getExecutedMigrations = async () => {
  try {
    const result = await pool.query(
      'SELECT migration_name, checksum FROM schema_migrations ORDER BY migration_name'
    );
    return new Map(result.rows.map(row => [row.migration_name, row.checksum]));
  } catch (error) {
    // If table doesn't exist, return empty map
    return new Map();
  }
};

// Record migration execution
const recordMigration = async (filename, checksum, executionTime) => {
  await pool.query(
    `INSERT INTO schema_migrations (migration_name, checksum, execution_time_ms)
     VALUES ($1, $2, $3)
     ON CONFLICT (migration_name) DO UPDATE
     SET checksum = $2, execution_time_ms = $3, executed_at = CURRENT_TIMESTAMP`,
    [filename, checksum, executionTime]
  );
};

const runMigrations = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting database migrations...\n');

    // Ensure migrations tracking table exists
    await ensureMigrationsTable();

    // Get already executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`📊 Found ${executedMigrations.size} previously executed migrations\n`);

    // Read all migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files\n`);

    let executed = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = calculateChecksum(sql);

      // Check if migration already executed
      if (executedMigrations.has(file)) {
        const existingChecksum = executedMigrations.get(file);

        if (existingChecksum === checksum) {
          console.log(`⏭️  SKIP: ${file} (already executed)`);
          skipped++;
          continue;
        } else {
          console.log(`⚠️  WARNING: ${file} has been modified (checksum changed)`);
          console.log(`   Old: ${existingChecksum}`);
          console.log(`   New: ${checksum}`);
          console.log(`   Re-running migration...\n`);
        }
      }

      // Execute migration
      try {
        console.log(`▶️  RUNNING: ${file}`);
        const startTime = Date.now();

        await client.query('BEGIN');
        await client.query(sql);

        const executionTime = Date.now() - startTime;

        // Record migration
        await recordMigration(file, checksum, executionTime);

        await client.query('COMMIT');

        console.log(`✅ SUCCESS: ${file} (${executionTime}ms)\n`);
        executed++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ FAILED: ${file}`);
        console.error(`   Error: ${error.message}\n`);
        failed++;

        // Continue with other migrations instead of stopping
        console.log('⏩ Continuing with next migration...\n');
      }
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Executed: ${executed}`);
    console.log(`⏭️  Skipped:  ${skipped}`);
    console.log(`❌ Failed:   ${failed}`);
    console.log(`📁 Total:    ${migrationFiles.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failed > 0) {
      console.log('⚠️  Some migrations failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('🎉 All migrations completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Migration system error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

// Run migrations
runMigrations();
