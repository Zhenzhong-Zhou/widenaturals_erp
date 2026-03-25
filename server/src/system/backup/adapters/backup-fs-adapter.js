const fs = require('node:fs/promises');
const path = require('node:path');
const { logSystemDebug } = require('../../../utils/logging/system-logger');

/**
 * Removes local backup files after a confirmed S3 upload.
 * Each file is attempted independently — failures are silently ignored
 * since local cleanup after a successful upload is best-effort.
 *
 * @param {string[]} filePaths - Absolute paths to delete
 * @returns {Promise<void>}
 */
const cleanupLocalFiles = async (filePaths) => {
  const results = await Promise.allSettled(filePaths.map((f) => fs.unlink(f)));
  
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
 * Deletes old local backup files exceeding the retention limit.
 *
 * Counts `.enc` files as backup copies — each copy has two sidecars
 * (.enc.iv, .enc.sha256) that are deleted alongside it. Keeps the
 * newest `maxBackups` copies and removes the rest.
 *
 * @param {Object} params
 * @param {string} params.dir - Directory containing backup files
 * @param {number} params.maxBackups - Number of backup copies to retain
 * @returns {Promise<number>} Number of backup copies deleted
 */
const cleanupLocalBackups = async ({ dir, maxBackups }) => {
  const files = await fs.readdir(dir);
  
  // Each .enc file represents one backup copy
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
  
  if (backupFiles.length <= maxBackups) return 0;
  
  // Newest first — keep the first maxBackups entries, delete the rest
  backupFiles.sort((a, b) => b.time - a.time);
  
  const filesToDelete = backupFiles.slice(maxBackups);
  
  await Promise.all(
    filesToDelete.map(async (file) => {
      await fs.unlink(file.path);
      
      // Delete sidecars — best-effort, non-blocking
      await Promise.allSettled([
        fs.unlink(`${file.path}.sha256`),
        fs.unlink(`${file.path}.iv`),
      ]);
    })
  );
  
  return filesToDelete.length;
};

module.exports = {
  cleanupLocalFiles,
  cleanupLocalBackups,
};
