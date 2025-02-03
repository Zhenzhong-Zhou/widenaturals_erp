const { promisify } = require('util');
const { exec } = require('child_process');
const { logInfo, logError } = require('../utils/logger-helper');

const execAsync = promisify(exec);

/**
 * Runs the pg_dump command to create a database backup securely.
 * @param {string} dumpCommand - The pg_dump command to execute.
 * @param {boolean} isProduction - Whether running in production mode.
 * @param {string} dbUser - Database username.
 * @param {string} dbPassword - Database password.
 * @returns {Promise<void>}
 */
const runPgDump = async (dumpCommand, isProduction, dbUser, dbPassword) => {
  try {
    logInfo('Starting pg_dump execution...');
    
    const execOptions = {
      timeout: 300000, // 5-minute timeout
      env: {
        ...process.env, // Preserve existing env variables
      },
    };
    
    // In production, rely on .pgpass, so do not pass PGPASSWORD
    if (!isProduction) {
      execOptions.env.PGUSER = dbUser;
      execOptions.env.PGPASSWORD = dbPassword;
    }
    
    const { stdout, stderr } = await execAsync(dumpCommand, execOptions);
    
    if (stdout) logInfo(`pg_dump output: ${stdout}`);
    if (stderr) logError(`pg_dump warnings: ${stderr}`);
  } catch (error) {
    if (error.killed) {
      logError('pg_dump was terminated by the user or a system signal.');
    } else {
      logError('pg_dump failed:', {
        message: error.message,
        code: error.code,
        signal: error.signal,
        cmd: error.cmd,
      });
    }
    throw error;
  }
};

module.exports = { runPgDump };
