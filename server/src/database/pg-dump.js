const { promisify } = require('util');
const { exec } = require('child_process');
const { logInfo, logError } = require('../utils/logger-helper');

const execAsync = promisify(exec);

/**
 * Runs the pg_dump command to create a database backup.
 * @param {string} dumpCommand - The pg_dump command to execute.
 * @returns {Promise<void>}
 */
const runPgDump = async (dumpCommand) => {
  try {
    const { stdout, stderr } = await execAsync(dumpCommand);
    logInfo(`pg_dump output: ${stdout}`);
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
