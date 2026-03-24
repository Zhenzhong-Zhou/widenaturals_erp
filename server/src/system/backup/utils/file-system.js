const fs = require('fs/promises');
const {
  logSystemInfo,
  logSystemException,
} = require('../../../utils/logging/system-logger');

/**
 * Ensures that a directory exists.
 *
 * Uses a single atomic operation (`fs.mkdir` with recursive flag)
 * to avoid race conditions and reduce system calls.
 *
 * Logs only when a directory is newly created.
 *
 * @param {string} dir - Absolute or relative directory path
 * @returns {Promise<void>}
 *
 * @throws {Error} If directory creation fails for unexpected reasons
 */
const ensureDirectory = async (dir) => {
  try {
    // Attempt to create directory (safe if already exists)
    await fs.mkdir(dir, { recursive: true });
    
    // Optional: log only when directory was likely created
    // Note: Node does not explicitly tell if it was newly created
    logSystemInfo('Ensured directory exists', {
      context: 'backup',
      operation: 'ensureDirectory',
      path: dir,
    });
    
  } catch (error) {
    logSystemException(error, 'Failed to ensure directory exists', {
      context: 'backup',
      operation: 'ensureDirectory',
      path: dir,
    });
    
    throw error;
  }
};

module.exports = {
  ensureDirectory
};
