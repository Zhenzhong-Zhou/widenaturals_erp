const { exec, execSync } = require('child_process');
const { logSystemInfo } = require('../utils/system-logger');
const path = require('path');
const fs = require('fs');

// Check if running in production or development
const isProduction = process.env.NODE_ENV === 'production';

// Define a log path based on environment
const logsPath = isProduction
  ? path.resolve('/logs/database') // Production path
  : path.resolve(process.env.LOGS_DIR || '../../dev_logs'); // Local path

// Define paths for your cron job scripts
const cronBackupPath = path.resolve(
  __dirname,
  '../tasks/schedulers/backup-scheduler.js'
);

// Ensure logs directory exists
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

// Define the PATH depending on the environment
const PATH_ENV = isProduction
  ? '/usr/local/bin' // Ubuntu default PATH
  : '/opt/homebrew/bin'; // macOS with Homebrew

// Dynamically resolve the Node.js path
const nodePath = execSync('which node').toString().trim();

// Define Timezone (UTC)
const TIMEZONE = 'UTC';

// Define your cron jobs
const cronJobs = [
  // Runs the backup-scheduler.js every minute (for testing purpose, change to 2 AM for production)
  `0 2 * * * PATH=${PATH_ENV} NODE_ENV=${isProduction ? 'production' : 'development'} TZ=${TIMEZONE} ${nodePath} ${cronBackupPath} >> ${logsPath}/cron-backup.log 2>&1`,
  // `* * * * * PATH=${PATH_ENV} NODE_ENV=${isProduction ? 'production': 'development'} TZ=${TIMEZONE} ${nodePath} ${cronBackupPath} >> ${logsPath}/cron-backup.log 2>&1`,
];

/**
 * Adds cron jobs to the crontab.
 */
const setupCronJobs = () => {
  logSystemInfo('Registering cron jobs...', {
    context: 'setup-cron',
  });

  const cronString = cronJobs.join('\n') + '\n';
  logSystemInfo('Generated cron job string.', {
    context: 'setup-cron',
    jobCount: cronJobs.length,
    preview: cronString, // or omit if too verbose
  });

  exec(`echo "${cronString}" | crontab -`, (error, stdout, stderr) => {
    if (error) {
      logSystemException(error, 'Failed to set up cron jobs.', {
        context: 'setup-cron',
        stderr,
      });
      return;
    }
    
    logSystemInfo('Cron jobs set up successfully.', {
      context: 'setup-cron',
      stdout: stdout.trim(),
    });
  });
};

// Run setup if script is executed directly
if (require.main === module) {
  setupCronJobs();
}
