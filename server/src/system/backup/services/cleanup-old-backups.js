const AppError = require('../../../utils/AppError');
const {
  logSystemInfo,
  logSystemException
} = require('../../../utils/logging/system-logger');
const { cleanupS3Backups } = require('../adapters/backup-s3-adapter');
const { cleanupLocalBackups } = require('../adapters/backup-fs-adapter');

/**
 * Cleans up old backups from either S3 or local filesystem.
 *
 * This is the orchestration layer responsible for:
 * - validating input
 * - choosing storage strategy (S3 vs local)
 * - handling AppError and logging
 *
 * @param {Object} params
 * @param {string} params.dir - Local directory path
 * @param {number} params.maxBackups - Number of backups to retain (must be multiple of 3)
 * @param {boolean} params.isProduction - Whether running in production (S3 mode)
 * @param {string} [params.bucketName] - S3 bucket name (required in production)
 * @param {number} [params.toleranceMs=5000] - Time tolerance for grouping S3 files
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
    // Validate input (SERVICE layer owns AppError)
    if (!Number.isInteger(maxBackups) || maxBackups <= 0 || maxBackups % 3 !== 0) {
      throw AppError.validationError(
        `Invalid maxBackups: ${maxBackups}. Must be a positive multiple of 3`
      );
    }
    
    logSystemInfo('Starting backup cleanup', {
      context: CONTEXT,
      mode: isProduction ? 'S3' : 'local',
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
    logSystemException(error, 'Backup cleanup failed', {
      context: CONTEXT,
    });
    
    throw error;
  }
};

module.exports = {
  cleanupOldBackupsService,
};
