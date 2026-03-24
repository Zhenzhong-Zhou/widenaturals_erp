/**
 * @file run-pg-dump.js
 * @description System utility for executing PostgreSQL pg_dump safely via child process.
 *
 * Overview:
 * - Provides a controlled wrapper around `pg_dump` using Node.js `spawn`
 * - Designed for use in system-level tasks such as backups and maintenance jobs
 * - Ensures non-blocking execution and memory-safe streaming
 *
 * Responsibilities:
 * - Execute pg_dump with provided CLI arguments
 * - Inject environment variables for authentication when required
 * - Stream stderr output for observability (without buffering large data)
 * - Return a Promise that resolves on success or rejects with a structured AppError
 *
 * Non-Responsibilities:
 * - Does NOT manage process lifecycle (no exit, no cleanup hooks)
 * - Does NOT perform scheduling (handled by cron or task orchestrators)
 * - Does NOT handle retry logic (delegated to higher-level utilities)
 * - Does NOT manage backup file storage or rotation
 *
 * Error Handling:
 * - Uses AppError for all failure scenarios
 * - Differentiates between:
 *   - PROCESS_SPAWN_FAILED (process could not start)
 *   - PROCESS_EXECUTION_FAILED (non-zero exit code)
 * - Logs all failures via system logger with structured metadata
 *
 * Logging Strategy:
 * - logSystemInfo → execution start / success
 * - logSystemWarn → stderr stream output (diagnostic, not failure)
 * - logSystemException → process failure scenarios
 *
 * Performance Considerations:
 * - Uses spawn (not exec) to avoid blocking and memory overflow
 * - Avoids buffering stdout/stderr to handle large database dumps safely
 * - Streams stderr incrementally for real-time diagnostics
 *
 * Security Considerations:
 * - Avoid logging sensitive arguments (e.g. credentials, connection strings)
 * - In non-production mode, credentials may be injected via environment variables
 * - In production, external credential management (e.g. .pgpass) is recommended
 *
 * Usage Context:
 * - Intended to be used by system tasks (e.g. backup runner)
 * - Can be composed into higher-level workflows with retry, timeout, and lifecycle control
 *
 * Example:
 *   await runPgDump(['-Fc', '-f', 'backup.dump', '-d', 'mydb'], {
 *     isProduction: true
 *   });
 */

const { spawn } = require('child_process');
const {
  logSystemInfo,
  logSystemException,
  logSystemWarn,
} = require('../../../utils/logging/system-logger');
const AppError = require('../../../utils/AppError');
const { ERROR_TYPES, ERROR_CODES } = require('../../../utils/constants/error-constants');

const CONTEXT = 'system:pg-dump';

/**
 * Executes pg_dump using a safe, non-blocking child process.
 *
 * Responsibilities:
 * - Spawn pg_dump with controlled environment variables
 * - Stream stderr output for diagnostics (without buffering)
 * - Resolve on success (exit code 0)
 * - Reject with structured AppError on failure
 *
 * Non-Responsibilities:
 * - Does NOT manage process lifecycle (no exit/cleanup)
 * - Does NOT handle file output (delegated to pg_dump args)
 * - Does NOT retry (handled at higher layer if needed)
 *
 * @param {string[]} args - pg_dump CLI arguments
 * @param {Object} options
 * @param {boolean} options.isProduction
 * @param {string} [options.dbUser]
 * @param {string} [options.dbPassword]
 *
 * @returns {Promise<void>}
 *
 * @throws {AppError} PROCESS_SPAWN_FAILED | PROCESS_EXECUTION_FAILED
 */
const runPgDump = async (args = [], options = {}) => {
  const { isProduction, dbUser, dbPassword } = options;
  
  //--------------------------------------------------
  // Input validation (fail fast)
  //--------------------------------------------------
  if (!Array.isArray(args)) {
    throw new AppError(
      'Invalid pg_dump arguments',
      500,
      {
        type: ERROR_TYPES.SYSTEM,
        code: ERROR_CODES.PROCESS_EXECUTION_FAILED,
        context: CONTEXT,
        meta: { receivedType: typeof args },
      }
    );
  }
  
  return new Promise((resolve, reject) => {
    logSystemInfo('Starting pg_dump execution', {
      context: CONTEXT,
      argCount: args.length, // avoid logging full args
      isProduction,
    });
    
    //--------------------------------------------------
    // Build environment safely
    //--------------------------------------------------
    const env = { ...process.env };
    
    if (!isProduction) {
      env.PGUSER = dbUser;
      env.PGPASSWORD = dbPassword;
    }
    
    //--------------------------------------------------
    // Spawn process (non-blocking)
    //--------------------------------------------------
    const dump = spawn('pg_dump', args, {
      env,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    
    //--------------------------------------------------
    // Stream stderr (diagnostic only, not failure signal)
    //--------------------------------------------------
    dump.stderr.on('data', (data) => {
      logSystemWarn('pg_dump stderr output', {
        context: CONTEXT,
        chunk: data.toString(),
      });
    });
    
    //--------------------------------------------------
    // Spawn failure (binary missing / permission error)
    //--------------------------------------------------
    dump.on('error', () => {
      const error = new AppError(
        'pg_dump process failed to start',
        500,
        {
          type: ERROR_TYPES.SYSTEM,
          code: ERROR_CODES.PROCESS_SPAWN_FAILED,
          context: CONTEXT,
          meta: { command: 'pg_dump' },
        }
      );
      
      logSystemException(error, 'pg_dump spawn failed', {
        context: CONTEXT,
      });
      
      reject(error);
    });
    
    //--------------------------------------------------
    // Process completion
    //--------------------------------------------------
    dump.on('close', (code) => {
      if (code === 0) {
        logSystemInfo('pg_dump completed successfully', {
          context: CONTEXT,
        });
        return resolve();
      }
      
      const error = new AppError(
        'pg_dump failed',
        500,
        {
          type: ERROR_TYPES.SYSTEM,
          code: ERROR_CODES.PROCESS_EXECUTION_FAILED,
          context: CONTEXT,
          meta: {
            command: 'pg_dump',
            exitCode: code,
          },
        }
      );
      
      logSystemException(error, 'pg_dump execution failed', {
        context: CONTEXT,
        exitCode: code,
      });
      
      reject(error);
    });
  });
};

module.exports = {
  runPgDump,
};
