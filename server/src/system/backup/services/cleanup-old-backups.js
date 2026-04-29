const {
  logSystemInfo,
  logSystemWarn,
} = require('../../../utils/logging/system-logger');
const { cleanupS3Backups } = require('../adapters/backup-s3-adapter');
const { cleanupLocalBackups } = require('../adapters/backup-fs-adapter');

/**
 * Orchestrates old backup cleanup across storage backends.
 *
 * Validates retention policy, selects the appropriate storage adapter
 * (S3 or local filesystem), and delegates deletion. Each adapter owns
 * its own file-counting logic — this layer speaks only in backup copies.
 *
 * @param {Object} params
 * @param {string} params.dir - Local backup directory path
 * @param {number} params.maxBackups - Number of backup copies to retain
 * @param {boolean} params.isProduction - Whether to target S3 (true) or local (false)
 * @param {string} [params.bucketName] - S3 bucket name (required when isProduction is true)
 * @param {number} [params.toleranceMs=5000] - Timestamp tolerance for S3 file grouping
 * @returns {Promise<void>}
 */
const cleanupOldBackupsService = async ({
  dir,
  maxBackups,
  isProduction,
  bucketName,
  toleranceMs = 5000,
}) => {
  const CONTEXT = 'backup-cleanup';

  try {
    // Fall back on invalid input — cleanup is secondary to the backup itself
    if (!Number.isInteger(maxBackups) || maxBackups <= 0) {
      logSystemWarn(
        `Invalid maxBackups: ${maxBackups}. Falling back to default (5).`,
        {
          context: CONTEXT,
          originalValue: maxBackups,
          fallback: 5,
        }
      );
      maxBackups = 5;
    }

    logSystemInfo('Starting backup cleanup', {
      context: CONTEXT,
      mode: isProduction ? 'S3' : 'local',
      maxBackups,
    });

    if (isProduction && bucketName) {
      const deletedCount = await cleanupS3Backups({
        bucketName,
        maxBackups,
        toleranceMs,
      });

      logSystemInfo('S3 backup cleanup completed', {
        context: CONTEXT,
        deletedCount,
      });

      return;
    }

    const deletedCount = await cleanupLocalBackups({
      dir,
      maxBackups,
    });

    logSystemInfo('Local backup cleanup completed', {
      context: CONTEXT,
      deletedCount,
    });
  } catch (error) {
    // Non-fatal — backup succeeded, only rotation failed
    logSystemWarn('Old backup cleanup failed', {
      context: CONTEXT,
      reason: error.message, // message only, not full error object
    });
  }
};

module.exports = {
  cleanupOldBackupsService,
};
