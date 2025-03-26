const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { deleteFilesFromS3, listFilesInS3 } = require('../utils/aws-s3-service');
const { groupFilesWithTolerance } = require('../utils/db-file-management-helper');

/**
 * Ensures the backup directory exists.
 * @param {string} dir - Directory path.
 * @returns {Promise<void>}
 */
const ensureDirectory = async (dir) => {
  try {
    await fs.access(dir); // Check if directory exists
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directory does not exist, create it
      await fs.mkdir(dir, { recursive: true });
      logInfo(`Created backup directory at: ${dir}`);
    } else {
      throw error; // Re-throw other errors
    }
  }
};

/**
 * Generates a SHA-256 hash for the given file.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<string>} - Hash value.
 */
const generateHash = async (filePath) => {
  const fileData = await fs.readFile(filePath); // Read file asynchronously
  const hash = crypto.createHash('sha256');
  hash.update(fileData);
  return hash.digest('hex'); // Return hash as a hex string
};

/**
 * Saves a hash to a file.
 * @param {string} hash - Hash value.
 * @param {string} filePath - Path to save the hash file.
 * @returns {Promise<void>}
 */
const saveHashToFile = async (hash, filePath) => {
  await fs.writeFile(filePath, hash, 'utf8'); // Write hash asynchronously
};

/**
 * Verifies file integrity by comparing its hash with the original hash.
 *
 * @param {string} filePath - Path to the file to verify.
 * @param {string} originalHash - Original SHA256 hash string for comparison.
 * @returns {Promise<void>}
 */
const verifyFileIntegrity = async (filePath, originalHash) => {
  try {
    logInfo(`🔍 Verifying integrity of file: ${filePath}`);
    const generatedHash = await generateHash(filePath);
    if (generatedHash.trim() !== originalHash.trim()) {
      throw new Error('File integrity check failed. The downloaded file is corrupted or tampered with.');
    }
    logInfo('File integrity verified successfully.');
  } catch (error) {
    logError('Failed to verify file integrity:', error.message);
    throw error;
  }
};

/**
 * Deletes old backups and associated files, keeping only the most recent ones.
 * - In production (S3 mode), files are deleted from the specified S3 bucket.
 * - In development (local mode), files are deleted from the local directory.
 *
 * @param {string} dir - The local backup directory path where backups are stored (only used in development mode).
 * @param {number} maxFiles - The maximum number of backup files to retain. Older files are deleted to maintain this limit.
 * @param {boolean} isProduction - A flag indicating if the environment is production (`true`) or development (`false`).
 * @param {string} bucketName - The name of the S3 bucket where backups are stored (only used in production mode).
 * @param toleranceMs
 * @returns {Promise<void>} - Resolves when cleanup is complete. Throws an error if the process fails.
 */
const cleanupOldBackups = async (dir, maxFiles, isProduction, bucketName, toleranceMs = 5000) => {
  try {
    // Validate maxFiles
    if (!Number.isInteger(maxFiles) || maxFiles <= 0 || maxFiles % 3 !== 0) {
      throw AppError.validationError(
        `Invalid MAX_BACKUPS value: ${maxFiles}. It must be a positive multiple of 3 (e.g., 3, 6, 9, etc.).`
      );
    }
    
    if (isProduction && bucketName) {
      // Production Mode: Delete from S3
      logInfo('Starting S3 backup cleanup process...');
      
      const backupPrefix = 'backups/';
      
      // List files from S3
      const files = await listFilesInS3(bucketName, backupPrefix);
      
      // Group files with tolerance handling
      const fileGroups = groupFilesWithTolerance(files, toleranceMs);
      
      // Sort groups by the LastModified date of the .enc file
      const sortedGroups = fileGroups.sort((a, b) => {
        const encFileA = a.find(f => f.Key.endsWith('.enc'));
        const encFileB = b.find(f => f.Key.endsWith('.enc'));
        
        if (encFileA && encFileB) {
          return new Date(encFileA.LastModified) - new Date(encFileB.LastModified);
        }
        
        const latestFileA = a.sort((x, y) => new Date(y.LastModified) - new Date(x.LastModified))[0];
        const latestFileB = b.sort((x, y) => new Date(y.LastModified) - new Date(x.LastModified))[0];
        
        return new Date(latestFileA.LastModified) - new Date(latestFileB.LastModified);
      });
      
      // Identify groups to delete (Keep only the most recent `maxFiles` groups)
      const groupsToDelete = sortedGroups.slice(0, sortedGroups.length - maxFiles);
      
      if (groupsToDelete.length === 0) {
        logInfo(`All backups are within the limit of ${maxFiles}. No files deleted.`);
        return;
      }
      
      // Prepare keys to delete
      const keysToDelete = [];
      groupsToDelete.forEach(group => {
        group.forEach(file => keysToDelete.push({ Key: file.Key }));
      });
      
      // Delete files from S3
      await deleteFilesFromS3(bucketName, keysToDelete);
      
      logInfo(`Successfully deleted ${keysToDelete.length} old backups from S3.`);
    } else {
      // Development Mode: Delete locally
      logInfo('Starting local backup cleanup process...');
      
      const allFiles = await fs.readdir(dir);
      
      // Collect file metadata for sorting
      const backupFiles = (
        await Promise.all(
          allFiles
            .filter(file => file.endsWith('.enc'))
            .map(async file => {
              const filePath = path.join(dir, file);
              const stats = await fs.stat(filePath);
              return { name: file, time: stats.mtime.getTime() };
            })
        )
      ).sort((a, b) => b.time - a.time); // Sort files by modification time (newest first)
      
      if (backupFiles.length === 0) {
        logInfo('No backup files found for cleanup.');
        return;
      }
      
      // Identify files to delete
      const filesToDelete = backupFiles.slice(maxFiles);
      
      if (filesToDelete.length === 0) {
        logInfo(`All backups are within the limit of ${maxFiles} files. No files deleted.`);
        return;
      }
      
      // Delete files and associated metadata
      await Promise.all(
        filesToDelete.map(async file => {
          const filePath = path.join(dir, file.name);
          try {
            await fs.unlink(filePath);
            logInfo(`Deleted old backup: ${file.name}`);
            
            // Attempt to delete associated files
            const hashFilePath = `${filePath}.sha256`;
            const ivFilePath = `${filePath}.iv`;
            
            await fs.unlink(hashFilePath).catch(() => logWarn(`No hash file to delete for: ${file.name}`));
            await fs.unlink(ivFilePath).catch(() => logWarn(`No IV file to delete for: ${file.name}`));
          } catch (deleteError) {
            logError(`Failed to delete file: ${file.name}`, { error: deleteError.message });
          }
        })
      );
      
      logInfo(`Cleanup of old backups completed. ${filesToDelete.length} files deleted.`);
    }
  } catch (error) {
    logError('Error during cleanup of old backups:', { error: error.message });
    throw error;
  }
};

module.exports = {
  ensureDirectory,
  generateHash,
  saveHashToFile,
  verifyFileIntegrity,
  cleanupOldBackups,
};
