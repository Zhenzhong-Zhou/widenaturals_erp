/**
 * @file restore-database.js
 * @description Executes a PostgreSQL restore from a local decrypted backup file.
 * Handles process spawning and output capture only — no S3, no decryption, no cleanup.
 *
 * Execution modes:
 * - Imported: call `restoreDatabase()` directly; `runPgRestore` is internal only.
 */

const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const AppError = require('../../utils/AppError');
const {
  logSystemInfo,
  logSystemWarn,
} = require('../../utils/logging/system-logger');

/**
 * Executes pg_restore via spawn (no shell interpolation) and resolves with
 * the combined stdout/stderr output on success.
 *
 * Uses `--jobs=4` for parallel table restoration; reduce if the target host
 * has fewer than 4 cores available to PostgreSQL.
 *
 * @param {{
 *   decryptedFilePath: string,
 *   databaseName: string,
 *   dbUser: string,
 *   dbPassword?: string
 * }} params
 * @returns {Promise<{ stdout: string, stderr: string }>}
 * @throws {Error} If pg_restore exits with a non-zero code or fails to spawn.
 */
const runPgRestore = ({
  decryptedFilePath,
  databaseName,
  dbUser,
  dbPassword,
}) => {
  return new Promise((resolve, reject) => {
    const args = [
      '--clean',
      '--if-exists',
      '--jobs=4',
      '--format=custom',
      `--dbname=${databaseName}`,
      `--username=${dbUser}`,
      decryptedFilePath,
    ];

    // Pass the password via env rather than a CLI flag to avoid shell exposure
    const env = { ...process.env };
    if (dbPassword) env.PGPASSWORD = dbPassword;

    const restore = spawn('pg_restore', args, { env });

    let stdout = '';
    let stderr = '';

    restore.stdout.on('data', (data) => (stdout += data.toString()));
    restore.stderr.on('data', (data) => (stderr += data.toString()));

    // 'error' fires when the process cannot be spawned at all (e.g. binary not found)
    // Without this handler the rejection bypasses the 'close' handler entirely
    restore.on('error', (err) => reject(err));

    restore.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(`pg_restore failed with code ${code}\n${stderr}`)
        );
      }
      resolve({ stdout, stderr });
    });
  });
};

/**
 * Restores a PostgreSQL database from a local decrypted backup file.
 *
 * Intentionally scoped to database restoration only — does not download,
 * decrypt, or clean up files. Callers are responsible for providing a valid
 * decrypted file path. Error logging is omitted here; errors propagate to
 * the caller (restore-backup.js) which owns the log entry.
 *
 * @param {{
 *   decryptedFilePath: string,
 *   databaseName: string,
 *   dbUser: string,
 *   dbPassword?: string
 * }} params
 * @returns {Promise<void>}
 * @throws {AppError} If the decrypted file is not found.
 * @throws {Error} If pg_restore exits with a non-zero code or fails to spawn.
 */
const restoreDatabase = async ({
  decryptedFilePath,
  databaseName,
  dbUser,
  dbPassword = '',
}) => {
  // Confirm the file exists before invoking pg_restore — a missing file
  // produces a confusing pg_restore error rather than a clear AppError
  try {
    await fs.access(decryptedFilePath);
  } catch {
    throw AppError.notFoundError(
      `Decrypted backup file not found: ${decryptedFilePath}`
    );
  }

  logSystemInfo('Executing pg_restore', {
    context: 'restore-db',
    database: databaseName,
    decryptedFilePath,
  });

  const { stdout, stderr } = await runPgRestore({
    decryptedFilePath,
    databaseName,
    dbUser,
    dbPassword,
  });

  if (stdout) {
    logSystemInfo('pg_restore output', {
      context: 'restore-db',
      database: databaseName,
      stdout,
    });
  }

  // pg_restore writes informational notices to stderr even on success
  // (e.g. "relation already exists") — these are warnings, not failures
  if (stderr) {
    logSystemWarn('pg_restore warnings', {
      context: 'restore-db',
      database: databaseName,
      stderr,
    });
  }

  logSystemInfo('Database restore completed successfully', {
    context: 'restore-db',
    database: databaseName,
  });
};

module.exports = {
  restoreDatabase,
};
