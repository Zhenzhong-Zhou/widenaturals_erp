const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { runPgDump } = require('./pg-dump');
const { ensureDirectory, generateHash, saveHashToFile, cleanupOldBackups } = require('./file-management');
const { encryptFile } = require('./encryption');
const { logInfo, logError } = require('../utils/logger-helper');

const targetDatabase = process.env.DB_NAME;
const backupDir = process.env.BACKUP_DIR || './backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `${targetDatabase}-${timestamp}.sql`);
const encryptedFile = `${backupFile}.enc`;
const pgDumpPath = process.env.PG_DUMP_PATH || 'pg_dump';
const maxBackups = parseInt(process.env.MAX_BACKUPS, 10) || 5;

/**
 * Backs up the database.
 */
const backupDatabase = async () => {
  if (!targetDatabase) {
    throw new Error('Environment variable DB_NAME is missing.');
  }
  
  try {
    ensureDirectory(backupDir);
    cleanupOldBackups(backupDir, maxBackups);
    
    logInfo(`Starting backup for database: '${targetDatabase}'`);
    const dumpCommand = `${pgDumpPath} --no-owner --no-comments --clean --if-exists -d ${targetDatabase} -f ${backupFile}`;
    await runPgDump(dumpCommand);
    
    const hash = generateHash(backupFile);
    saveHashToFile(hash, `${backupFile}.sha256`);
    
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    await encryptFile(backupFile, encryptedFile, encryptionKey);
    
    fs.unlinkSync(backupFile); // Delete plain-text file
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
