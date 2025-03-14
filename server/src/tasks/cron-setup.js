const { exec } = require('child_process');
const { logError, logInfo } = require('../utils/logger-helper');

// Define your cron jobs
const cronJobs = [
  '0 2 * * * /usr/bin/node /path/to/cron-setup.js >> /path/to/logs/cron-backup.log 2>&1',
  '0 3 * * * /usr/bin/node /path/to/cleanup-temp.js >> /path/to/logs/cleanup.log 2>&1',
];

/**
 * Adds cron jobs to the crontab.
 */
const setupCronJobs = () => {
  const cronString = cronJobs.join('\n') + '\n';
  exec(`echo "${cronString}" | crontab -`, (error, stdout, stderr) => {
    if (error) {
      logError('Failed to set up cron jobs:', error.message);
      return;
    }
    logInfo('Cron jobs set up successfully.');
  });
};

// Run setup if script is executed directly
if (require.main === module) {
  setupCronJobs();
}
