/**
 * @file cron-setup.js
 * @description Registers scheduled cron jobs for system tasks.
 *
 * Execution modes:
 * - Imported: call `setupCronJobs()` directly
 * - Standalone: node cron-setup.js
 *
 * Environment variables:
 *   NODE_ENV              — determines production vs development paths
 *   LOGS_DIR              — overrides default dev log directory
 *   BACKUP_CRON_SCHEDULE  — cron schedule expression (default: '0 2 * * *')
 *   CRON_PATH             — PATH injected into cron environment
 */

const { execSync, exec } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { loadEnv } = require('../config/env');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/logging/system-logger');

const CONTEXT = 'cron-setup';

const resolveNodePath = () => {
  try {
    const detected = execSync('which node').toString().trim();
    
    // Reject IDE-managed Node paths (JetBrains, etc.)
    if (detected.includes('Application Support') || detected.includes('JetBrains')) {
      return '/opt/homebrew/bin/node'; // fallback (macOS M-series default)
    }
    
    return detected;
  } catch {
    return '/opt/homebrew/bin/node';
  }
};

/**
 * Resolves cron configuration from environment variables.
 * Called at runtime — not at module load — so loadEnv() has already run.
 *
 * @returns {{
 *   isProduction: boolean,
 *   logsDir: string,
 *   backupJobPath: string,
 *   nodePath: string,
 *   nodeEnv: string,
 *   cronPath: string,
 *   schedule: string
 * }}
 */
const resolveConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const logsDir = isProduction
    ? '/logs/database'
    : path.resolve(process.env.LOGS_DIR || path.join(__dirname, '../../../dev_logs'));
  
  // Updated path — backup-scheduler.js replaced by run-backup.js
  const backupJobPath = path.resolve(__dirname, '../system/backup/jobs/run-backup.js');
  
  // Resolved at call time, not module load
  const nodePath = resolveNodePath();
  
  const cronPath = process.env.CRON_PATH || (() => {
    try {
      const pgDumpDir = path.dirname(execSync('which pg_dump').toString().trim());
      const base = isProduction
        ? '/usr/local/bin:/usr/bin:/bin'
        : '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin';
      return `${pgDumpDir}:${base}`;
    } catch {
      return isProduction
        ? '/usr/local/bin:/usr/bin:/bin'
        : '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin';
    }
  })();
  
  return {
    isProduction,
    logsDir,
    backupJobPath,
    nodePath,
    nodeEnv: isProduction ? 'production' : 'development',
    cronPath,
    schedule: process.env.BACKUP_CRON_SCHEDULE || '0 2 * * *',
  };
};

const escapeCronPath = (p) => JSON.stringify(String(p));

/**
 * Builds cron job entry strings from resolved config.
 *
 * @param {ReturnType<typeof resolveConfig>} config
 * @returns {string[]}
 */
const buildCronJobs = ({ schedule, cronPath, nodeEnv, nodePath, backupJobPath, logsDir }) => {
  return [
    `${schedule} PATH=${cronPath} NODE_ENV=${nodeEnv} TZ=UTC ${escapeCronPath(nodePath)} ${escapeCronPath(backupJobPath)} >> ${escapeCronPath(path.join(logsDir, 'cron-backup.log'))} 2>&1`,
  ];
};

/**
 * Writes cron jobs to crontab via a temp file to avoid shell injection.
 *
 * @returns {Promise<void>}
 */
const setupCronJobs = () => {
  return new Promise((resolve, reject) => {
    loadEnv();
    
    const config = resolveConfig();
    const { logsDir } = config;
    
    // Ensure log directory exists before the cron job runs
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logSystemInfo('Created logs directory', { context: CONTEXT, logsDir });
    }
    
    const jobs = buildCronJobs(config);
    const cronString = jobs.join('\n') + '\n';
    
    logSystemInfo('Registering cron jobs', {
      context: CONTEXT,
      jobCount: jobs.length,
      schedule: config.schedule,
    });
    
    // Write to a temp file instead of piping through echo/printf
    // to avoid shell interpretation of special characters in the cron string
    const tmpFile = path.join(os.tmpdir(), `crontab-${process.pid}.tmp`);
    
    try {
      fs.writeFileSync(tmpFile, cronString, 'utf8');
    } catch (writeError) {
      logSystemException(writeError, 'Failed to write crontab temp file', {
        context: CONTEXT,
        tmpFile,
      });
      return reject(writeError);
    }
    
    exec(`crontab ${tmpFile}`, (error, stdout, stderr) => {
      // Clean up temp file regardless of outcome
      fs.unlink(tmpFile, () => {});
      
      if (error) {
        logSystemException(error, 'Failed to register cron jobs', {
          context: CONTEXT,
          stderr,
        });
        return reject(error);
      }
      
      logSystemInfo('Cron jobs registered successfully', {
        context: CONTEXT,
        jobCount: jobs.length,
      });
      
      resolve();
    });
  });
};

module.exports = { setupCronJobs };

// Standalone boundary — mirrors backup-database.js pattern
if (require.main === module) {
  setupCronJobs()
    .then(() => logSystemInfo('Cron setup completed successfully', { context: CONTEXT }))
    .catch((error) => {
      logSystemException(error, 'Cron setup failed', { context: CONTEXT });
      process.exit(1);
    });
}
