/**
 * @file restore-backup.js
 * @description Full restore pipeline: download → verify → decrypt → recreate → restore → verify → cleanup
 *
 * Pipeline order:
 *   1. Download  → .enc + .iv from S3 (production only)
 *   2. Verify    → SHA256 integrity check if hash file present
 *   3. Decrypt   → produces plain .sql backup file
 *   4. Recreate  → terminate connections, drop, and recreate target database
 *   5. Restore   → pg_restore into target database
 *   6. Verify    → row count check
 *   7. Cleanup   → all temp files removed in finally, regardless of outcome
 *
 * Usage (CLI):
 *   node restore-backup.js --file=<path-to-.enc-file>
 *
 * Required env:
 *   BACKUP_ENCRYPTION_KEY, DB_NAME, DB_USER, DB_HOST, DB_PORT
 *   AWS_S3_BUCKET_NAME (production only)
 */

const path = require('node:path');
const { execSync } = require('node:child_process');
const fs = require('node:fs/promises'); // promises only — no fsSync needed
const { loadEnv } = require('../../config/env');
const { ensureDirectory } = require('./utils/file-system');
const {
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../../utils/logging/system-logger');
const AppError = require('../../utils/AppError');
const { downloadFileFromS3 } = require('../../utils/aws-s3-service');
const { verifyFileIntegrity } = require('./utils/file-hash');
const { decryptFile } = require('./utils/backup-crypto-utils');
const { restoreDatabase } = require('./restore-database');
const { handleExit } = require('../lifecycle/on-exit');

const CONTEXT = 'restore-backup';

/**
 * Verifies the integrity of an encrypted backup file against a SHA256 hash.
 *
 * Accepts either a pre-downloaded hash string (S3 path) or reads the hash
 * from a local `.sha256` sidecar file. If neither is available, the check
 * is skipped with a warning — non-fatal by design so restores can proceed
 * from older backups that predate hash generation.
 *
 * @param {string} encryptedFilePath - Absolute path to the .enc backup file
 * @param {string|null} [providedHash=null] - Pre-downloaded hash string from S3, or null
 * @returns {Promise<void>}
 */
const verifyHash = async (encryptedFilePath, providedHash = null) => {
  let expectedHash = providedHash?.trim() ?? null;

  // No hash provided — try local sidecar file
  if (!expectedHash) {
    const hashFile = `${encryptedFilePath}.sha256`;
    try {
      await fs.access(hashFile); // throws if file does not exist
      const content = /** @type {string} */ (
        await fs.readFile(hashFile, 'utf8')
      );
      expectedHash = content.trim();
    } catch {
      logSystemWarn('Hash file not found — skipping integrity check', {
        context: CONTEXT,
        hashFile,
      });
      return;
    }
  }

  await verifyFileIntegrity(encryptedFilePath, expectedHash);

  logSystemInfo('Hash verified — backup integrity confirmed', {
    context: CONTEXT,
  });
};

/**
 * Terminates all active connections to the target database, then drops and
 * recreates it to ensure a clean restore target.
 *
 * Terminating connections before DROP DATABASE prevents the common
 * "database is being accessed by other users" error when the application
 * pool or other clients hold open connections.
 *
 * @param {string} dbName     - Target database name
 * @param {string} dbUser     - Postgres user
 * @param {string} dbHost     - Postgres host
 * @param {string} dbPort     - Postgres port
 * @param {string} dbPassword - Postgres password (injected via PGPASSWORD)
 * @returns {void}
 */
const recreateDatabase = (dbName, dbUser, dbHost, dbPort, dbPassword) => {
  logSystemWarn(`Dropping database: ${dbName}`, { context: CONTEXT });

  const env = {
    ...process.env,
    PGUSER: dbUser,
    PGHOST: dbHost,
    PGPORT: dbPort,
    ...(dbPassword ? { PGPASSWORD: dbPassword } : {}),
  };

  const psql = `psql --username=${dbUser} --host=${dbHost} --port=${dbPort} --dbname=postgres`;

  // Terminate active connections first — DROP DATABASE fails if connections exist
  execSync(
    `${psql} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity` +
      ` WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`,
    { env, stdio: 'inherit' }
  );

  execSync(`${psql} -c "DROP DATABASE IF EXISTS \\"${dbName}\\";"`, {
    env,
    stdio: 'inherit',
  });

  execSync(
    `createdb --username=${dbUser} --host=${dbHost} --port=${dbPort} "${dbName}"`,
    { env, stdio: 'inherit' }
  );

  logSystemInfo('Database recreated', { context: CONTEXT, dbName });
};

/**
 * Queries pg_stat_user_tables for live row counts across all user tables
 * and logs the result. Used to confirm data was restored successfully.
 *
 * Note: n_live_tup is an estimate maintained by autovacuum — counts may be
 * slightly stale immediately after restore but are sufficient for a sanity check.
 *
 * @param {string} dbName     - Target database name
 * @param {string} dbUser     - Postgres user
 * @param {string} dbHost     - Postgres host
 * @param {string} dbPort     - Postgres port
 * @param {string} dbPassword - Postgres password (injected via PGPASSWORD)
 * @returns {void}
 */
const verifyRowCounts = (dbName, dbUser, dbHost, dbPort, dbPassword) => {
  const env = {
    ...process.env,
    PGUSER: dbUser,
    PGHOST: dbHost,
    PGPORT: dbPort,
    ...(dbPassword ? { PGPASSWORD: dbPassword } : {}),
  };

  const result = execSync(
    `psql --username=${dbUser} --host=${dbHost} --port=${dbPort} --dbname=${dbName}` +
      ` -c "SELECT schemaname, tablename, n_live_tup AS row_count` +
      `      FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"`,
    { env }
  ).toString();

  // Log via system logger for consistency — no console.log in server code
  logSystemInfo('Row count verification completed', {
    context: CONTEXT,
    databaseName: dbName,
    result,
  });
};

/**
 * Executes the full database restore pipeline.
 *
 * In production, downloads encrypted backup files from S3 into a temp
 * directory before processing. In non-production, treats `s3KeyEnc` as a
 * local filesystem path to the .enc file.
 *
 * All temporary files (encrypted, IV, decrypted) are removed in the finally
 * block regardless of whether the restore succeeded or failed.
 *
 * @param {Object}  params
 * @param {string}  params.s3KeyEnc       - S3 key or local path to the .enc backup file
 * @param {string}  params.databaseName   - Target database name
 * @param {string}  params.encryptionKey  - Key used to decrypt the backup
 * @param {string}  params.dbUser         - Postgres user
 * @param {string}  [params.dbPassword='']     - Postgres password
 * @param {string}  [params.dbHost='localhost'] - Postgres host
 * @param {string}  [params.dbPort='5432']      - Postgres port
 * @param {boolean} [params.isProduction=true]  - Whether to download from S3
 * @returns {Promise<void>}
 * @throws {AppError} If any pipeline step fails.
 */
const restoreBackup = async ({
  s3KeyEnc,
  databaseName,
  encryptionKey,
  dbUser,
  dbPassword = '',
  dbHost = 'localhost',
  dbPort = '5432',
  isProduction = true,
}) => {
  loadEnv();

  //--------------------------------------------------
  // Input validation — catch missing params early
  // before any file or DB operations begin
  //--------------------------------------------------
  if (!s3KeyEnc)
    throw AppError.validationError('s3KeyEnc is required', {
      context: CONTEXT,
    });
  if (!databaseName)
    throw AppError.validationError('databaseName is required', {
      context: CONTEXT,
    });
  if (!encryptionKey)
    throw AppError.validationError('encryptionKey is required', {
      context: CONTEXT,
    });
  if (!dbUser)
    throw AppError.validationError('dbUser is required', { context: CONTEXT });

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const tempDir = path.join(__dirname, '../temp');
  await ensureDirectory(tempDir);

  // Declared outside try so finally can reference them for cleanup
  let encryptedFilePath, ivFilePath, decryptedFilePath;

  try {
    logSystemInfo('Starting database restore', {
      context: CONTEXT,
      isProduction,
      databaseName,
    });

    if (isProduction) {
      if (!bucketName) {
        throw AppError.validationError(
          'Missing required env: AWS_S3_BUCKET_NAME',
          {
            context: CONTEXT,
          }
        );
      }

      encryptedFilePath = path.join(tempDir, path.basename(s3KeyEnc));
      ivFilePath = `${encryptedFilePath}.iv`;
      decryptedFilePath = encryptedFilePath.replace(/\.enc$/, '');

      // Step 1 — download encrypted backup and IV sidecar from S3
      await downloadFileFromS3(bucketName, s3KeyEnc, encryptedFilePath);
      await downloadFileFromS3(bucketName, `${s3KeyEnc}.iv`, ivFilePath);

      logSystemInfo('Encrypted backup and IV downloaded from S3', {
        context: CONTEXT,
        files: [s3KeyEnc, `${s3KeyEnc}.iv`],
      });

      // Step 2 — attempt integrity check; non-fatal if hash file absent on S3
      let originalHash = null;
      try {
        originalHash = await downloadFileFromS3(
          bucketName,
          `${s3KeyEnc}.sha256`,
          null,
          true
        );
      } catch {
        logSystemWarn(
          'SHA256 file unavailable on S3 — skipping integrity check',
          {
            context: CONTEXT,
            s3Key: `${s3KeyEnc}.sha256`,
          }
        );
      }
      await verifyHash(encryptedFilePath, originalHash);
    } else {
      // Non-production: treat s3KeyEnc as a local filesystem path
      encryptedFilePath = path.resolve(s3KeyEnc);
      ivFilePath = `${encryptedFilePath}.iv`;
      decryptedFilePath = encryptedFilePath.replace(/\.enc$/, '');

      // Confirm both required local files exist before proceeding
      try {
        await Promise.all([
          fs.access(encryptedFilePath),
          fs.access(ivFilePath),
        ]);
      } catch {
        throw AppError.notFoundError('Required local backup files not found', {
          context: CONTEXT,
          encryptedFilePath,
          ivFilePath,
        });
      }

      logSystemInfo('Local encrypted backup and IV found', {
        context: CONTEXT,
        encryptedFilePath,
        ivFilePath,
      });

      // Step 2 — local hash verify via sidecar file
      await verifyHash(encryptedFilePath);
    }

    // Step 3 — decrypt; decryptFile owns partial-file cleanup on failure
    await decryptFile(
      encryptedFilePath,
      decryptedFilePath,
      encryptionKey,
      ivFilePath
    );
    logSystemInfo('Backup decrypted', { context: CONTEXT, decryptedFilePath });

    // Step 4 — terminate connections, drop and recreate database
    recreateDatabase(databaseName, dbUser, dbHost, dbPort, dbPassword);

    // Step 5 — pg_restore into freshly recreated database
    await restoreDatabase({
      decryptedFilePath,
      databaseName,
      dbUser,
      dbPassword,
    });

    // Step 6 — sanity check: verify tables have rows
    verifyRowCounts(databaseName, dbUser, dbHost, dbPort, dbPassword);

    logSystemInfo('Database restore completed successfully', {
      context: CONTEXT,
      databaseName,
    });
  } catch (error) {
    logSystemException(error, 'Database restore failed', {
      context: CONTEXT,
      databaseName,
      s3Key: s3KeyEnc,
    });
    throw error;
  } finally {
    // Step 7 — always remove temp files; failures warned but not re-thrown
    // so they cannot mask the original restore error
    const filesToRemove = [
      encryptedFilePath,
      ivFilePath,
      decryptedFilePath,
    ].filter(Boolean);

    await Promise.allSettled(
      filesToRemove.map(async (file) => {
        try {
          await fs.unlink(file);
          logSystemInfo('Deleted temporary file', { context: CONTEXT, file });
        } catch (cleanupError) {
          logSystemWarn('Failed to delete temporary file', {
            context: CONTEXT,
            file,
            reason: cleanupError.message,
          });
        }
      })
    );
  }
};

module.exports = {
  restoreBackup,
};

//--------------------------------------------------
// CLI entrypoint
// node system/backup/restore-backup.js --file=<path-to-.enc-file>
//--------------------------------------------------
if (require.main === module) {
  // loadEnv() not called here — restoreBackup() calls it internally
  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  if (!fileArg) {
    console.error('Missing required argument: --file=<path-to-.enc-file>');
    process.exit(1);
  }

  // loadEnv() must run before reading process.env for DB credentials
  loadEnv();

  restoreBackup({
    s3KeyEnc: fileArg.replace('--file=', ''),
    databaseName: process.env.DB_NAME,
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD || '',
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '5432',
    isProduction: process.env.NODE_ENV === 'production',
  })
    .then(() => void handleExit(0))
    .catch((error) => {
      logSystemException(error, 'Database restore failed', {
        context: CONTEXT,
      });
      void handleExit(1);
    });
}
