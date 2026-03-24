const fs = require('fs/promises');
const path = require('path');
const { logSystemDebug } = require('../../../utils/logging/system-logger');

/**
 * Removes local backup files after a confirmed S3 upload.
 * Each file is attempted independently — failures are silently ignored
 * since local cleanup after a successful upload is best-effort.
 *
 * @param {string[]} filePaths
 * @returns {Promise<void>}
 */
const cleanupLocalFiles = async (filePaths) => {
  const results = await Promise.allSettled(filePaths.map((f) => fs.unlink(f)));
  
  // In debug mode, surface any cleanup failures for observability
  // Failures are non-fatal — local cleanup after S3 upload is best-effort
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logSystemDebug('Failed to remove local backup file after S3 upload', {
        context: 'backup-upload',
        filePath: filePaths[index],
        reason: result.reason?.message,
      });
    }
  });
};

/**
 * Deletes old local backup files based on retention policy.
 *
 * @param {Object} params
 * @param {string} params.dir - Directory containing backup files
 * @param {number} params.maxBackups - Maximum number of backups to retain
 * @returns {Promise<number>} Number of deleted files
 */
const cleanupLocalBackups = async ({ dir, maxBackups }) => {
  const files = await fs.readdir(dir);
  
  const backupFiles = await Promise.all(
    files
      .filter((file) => file.endsWith('.enc'))
      .map(async (file) => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        return {
          name: file,
          path: filePath,
          time: stats.mtime.getTime(),
        };
      })
  );
  
  if (backupFiles.length === 0) return 0;
  
  // Sort by newest first
  backupFiles.sort((a, b) => b.time - a.time);
  
  const filesToDelete = backupFiles.slice(maxBackups);
  
  await Promise.all(
    filesToDelete.map(async (file) => {
      try {
        await fs.unlink(file.path);
        
        // Attempt to delete optional metadata files (non-blocking)
        await Promise.allSettled([
          fs.unlink(`${file.path}.sha256`),
          fs.unlink(`${file.path}.iv`),
        ]);
        
      } catch (err) {
        // Let upper layer handle logging
        throw err;
      }
    })
  );
  
  return filesToDelete.length;
};

module.exports = {
  cleanupLocalFiles,
  cleanupLocalBackups,
};
