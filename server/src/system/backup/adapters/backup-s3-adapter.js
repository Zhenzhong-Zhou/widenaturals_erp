const path = require('node:path');
const {
  uploadFileToS3,
  listFilesInS3,
  deleteFilesFromS3
} = require('../../../utils/aws-s3-service');
const {
  groupFilesWithTolerance,
  getGroupTimestamp
} = require('../utils/backup-grouping-utils');
const {
  logSystemInfo,
} = require('../../../utils/logging/system-logger');

/**
 * Uploads the encrypted backup, IV, and hash files to S3.
 * All three files are uploaded or the first failure propagates —
 * partial uploads are not considered successful.
 *
 * @param {{ encryptedFile: string, ivFile: string, hashFile: string, bucketName: string }} params
 * @returns {Promise<void>}
 *
 * @throws {Error} If any upload fails — error propagates to the caller for logging.
 */
const uploadBackupToS3 = async ({ encryptedFile, ivFile, hashFile, bucketName }) => {
  const s3KeyEnc  = `backups/${path.basename(encryptedFile)}`;
  const s3KeyIv   = `backups/${path.basename(ivFile)}`;
  const s3KeyHash = `backups/${path.basename(hashFile)}`;
  
  await uploadFileToS3(encryptedFile, bucketName, s3KeyEnc,  'application/gzip');
  await uploadFileToS3(ivFile,        bucketName, s3KeyIv,   'application/octet-stream');
  await uploadFileToS3(hashFile,      bucketName, s3KeyHash, 'text/plain');
  
  logSystemInfo('Backup files uploaded to S3', {
    context: 'backup-upload',
    files: [s3KeyEnc, s3KeyIv, s3KeyHash],
  });
};

/**
 * Deletes old backup files from S3 based on retention policy.
 *
 * This function:
 * - Lists backup files from S3
 * - Groups related files using timestamp tolerance
 * - Sorts groups by age (oldest → newest)
 * - Deletes groups exceeding retention limit
 *
 * Notes:
 * - This is an infrastructure adapter (no logging, no AppError)
 * - Assumes grouping utility returns { timestamp, files }
 *
 * @param {Object} params
 * @param {string} params.bucketName - S3 bucket name
 * @param {number} params.maxBackups - Number of backup groups to retain
 * @param {number} params.toleranceMs - Time tolerance for grouping files
 *
 * @returns {Promise<number>} Number of deleted S3 objects
 */
const cleanupS3Backups = async ({
                                  bucketName,
                                  maxBackups,
                                  toleranceMs,
                                }) => {
  //--------------------------------------------------
  // Fetch files from S3
  //--------------------------------------------------
  const files = await listFilesInS3(bucketName, 'backups/');
  
  //--------------------------------------------------
  // Group files by timestamp tolerance
  //--------------------------------------------------
  const groups = groupFilesWithTolerance(files, toleranceMs);
  
  if (groups.length === 0) return 0;
  
  //--------------------------------------------------
  // Precompute timestamps (avoid repeated calculation)
  //--------------------------------------------------
  const groupsWithTs = groups.map((group) => ({
    group,
    ts: getGroupTimestamp(group),
  }));
  
  //--------------------------------------------------
  // Sort groups by oldest first
  //--------------------------------------------------
  groupsWithTs.sort((a, b) => a.ts - b.ts);
  
  //--------------------------------------------------
  // Determine groups to delete
  //--------------------------------------------------
  const excessCount = groupsWithTs.length - maxBackups;
  
  if (excessCount <= 0) return 0;
  
  const groupsToDelete = groupsWithTs
    .slice(0, excessCount)
    .map((g) => g.group);
  
  //--------------------------------------------------
  // Flatten keys for deletion
  //--------------------------------------------------
  const keysToDelete = groupsToDelete.flatMap((g) =>
    g.files.map((f) => ({ Key: f.Key }))
  );
  
  //--------------------------------------------------
  // Delete in batches (S3 limit: 1000 per request)
  //--------------------------------------------------
  const BATCH_SIZE = 1000;
  let deletedCount = 0;
  
  for (let i = 0; i < keysToDelete.length; i += BATCH_SIZE) {
    const batch = keysToDelete.slice(i, i + BATCH_SIZE);
    
    await deleteFilesFromS3(bucketName, batch);
    deletedCount += batch.length;
  }
  
  return deletedCount;
};

module.exports = {
  uploadBackupToS3,
  cleanupS3Backups,
};
