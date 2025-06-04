const { promisify } = require('util');
const { exec } = require('child_process');
const {
  logSystemInfo,
  logSystemError,
  logSystemException
} = require('../utils/system-logger');

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
  logSystemInfo('Starting pg_dump execution', {
    context: 'pg-dump',
    isProduction,
  });
  
  const execOptions = {
    timeout: 300000, // 5-minute timeout
    env: {
      ...process.env, // Preserve existing env variables
    },
  };
  
  if (!isProduction) {
    execOptions.env.PGUSER = dbUser;
    execOptions.env.PGPASSWORD = dbPassword;
  }
  
  try {
    const { stdout, stderr } = await execAsync(dumpCommand, execOptions);
    
    if (stdout) {
      logSystemInfo('pg_dump stdout', {
        context: 'pg-dump',
        output: stdout,
      });
    }
    
    if (stderr) {
      logSystemError('pg_dump stderr', {
        context: 'pg-dump',
        output: stderr,
      });
    }
  } catch (error) {
    logSystemException(error, 'pg_dump failed', {
      context: 'pg-dump',
      dumpCommand,
      isProduction,
      code: error.code,
      signal: error.signal,
      cmd: error.cmd,
      stdout: error.stdout,
      stderr: error.stderr,
    });
    
    throw error;
  }
};

module.exports = { runPgDump };
