const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadEnv } = require('../config/env');
const { runPgDump } = require('./pg-dump');
const { ensureDirectory, generateHash, saveHashToFile, cleanupOldBackups } = require('./file-management');
const { encryptFile } = require('./encryption');
const { logInfo, logError } = require('../utils/logger-helper');

loadEnv();

const targetDatabase = process.env.DB_NAME;
const backupDir = process.env.BACKUP_DIR || './backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const baseFileName = `${targetDatabase}-${timestamp}`;
const backupFile = path.join(backupDir, `${baseFileName}.sql`);
const encryptedFile = `${backupFile}.enc`;
const ivFile = `${encryptedFile}.iv`;
const hashFile = `${encryptedFile}.sha256`;
const pgDumpPath = process.env.PG_DUMP_PATH || 'pg_dump';
const maxBackups = parseInt(process.env.MAX_BACKUPS, 10) || 5;

if (!Number.isInteger(maxBackups) || maxBackups <= 0) {
  throw new Error(`Invalid MAX_BACKUPS value: ${maxBackups}. Must be a positive integer.`);
}

/**
 * Backs up the database.
 */
const backupDatabase = async () => {
  if (!targetDatabase) {
    throw new Error('Environment variable DB_NAME is missing.');
  }
  
  try {
    // Ensure backup directory exists
    ensureDirectory(backupDir);
    
    // Cleanup old backups
    cleanupOldBackups(backupDir, maxBackups);
    
    logInfo(`Starting backup for database: '${targetDatabase}'`);
    
    // Run pg_dump
    const dumpCommand = `${pgDumpPath} --no-owner --no-comments --clean --if-exists -d ${targetDatabase} -f ${backupFile}`;
    await runPgDump(dumpCommand);
    
    // Generate and save hash
    const hash = generateHash(backupFile);
    saveHashToFile(hash, hashFile);
    
    // Encrypt the SQL file
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    await encryptFile(backupFile, encryptedFile, encryptionKey, ivFile);
    
    // Delete plain-text SQL file
    fs.unlinkSync(backupFile);
    logInfo(`Backup encrypted and saved: ${encryptedFile}`);
  } catch (error) {
    logError('Error during backup operation:', { error: error.message });
    throw error;
  }
};

module.exports = { backupDatabase };

// Self-executing script
if (require.main === module) {
  backupDatabase()
    .then(() => logInfo('Database backup completed successfully.'))
    .catch((error) => {
      logError('Failed to back up the database.', { error: error.message });
      process.exit(1);
    });
}
