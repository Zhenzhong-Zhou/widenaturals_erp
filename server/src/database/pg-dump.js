const { spawn } = require('child_process');
const {
  logSystemInfo,
  logSystemError,
  logSystemException,
} = require('../utils/system-logger');

/**
 * Runs the pg_dump command safely using spawn.
 * @param {string[]} args - The pg_dump argument list.
 * @param {boolean} isProduction - Whether running in production mode.
 * @param {string} dbUser - Database username.
 * @param {string} dbPassword - Database password.
 * @returns {Promise<void>}
 */
const runPgDump = async (args, isProduction, dbUser, dbPassword) => {
  return new Promise((resolve, reject) => {
    logSystemInfo('Starting pg_dump execution (safe spawn)', {
      context: 'pg-dump',
      args,
      isProduction,
    });

    const env = { ...process.env };
    if (!isProduction) {
      env.PGUSER = dbUser;
      env.PGPASSWORD = dbPassword;
    }

    const dump = spawn('pg_dump', args, { env });

    let stdout = '';
    let stderr = '';

    dump.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    dump.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    dump.on('close', (code) => {
      if (stdout) {
        logSystemInfo('pg_dump stdout', { context: 'pg-dump', output: stdout });
      }
      if (stderr) {
        logSystemError('pg_dump stderr', {
          context: 'pg-dump',
          output: stderr,
        });
      }

      if (code === 0) {
        return resolve();
      }

      const error = new Error(`pg_dump failed with exit code ${code}`);
      logSystemException(error, 'pg_dump failed', {
        context: 'pg-dump',
        args,
        code,
        stdout,
        stderr,
      });
      reject(error);
    });
  });
};

module.exports = { runPgDump };
