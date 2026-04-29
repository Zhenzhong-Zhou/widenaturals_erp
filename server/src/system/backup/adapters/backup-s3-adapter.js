const path = require('node:path');
const {
  uploadFileToS3,
  listFilesInS3,
  deleteFilesFromS3,
} = require('../../../utils/aws-s3-service');
const {
  groupFilesWithTolerance,
  getGroupTimestamp,
} = require('../utils/backup-grouping-utils');
const { logSystemInfo } = require('../../../utils/logging/system-logger');

/**
 * Uploads the encrypted backup, IV, and hash files to S3.
 * All three files are uploaded sequentially — the first failure
 * propagates and partial uploads are not considered successful.
 *
 * @param {Object} params
 * @param {string} params.encryptedFile - Absolute path to .enc file
 * @param {string} params.ivFile - Absolute path to .enc.iv file
 * @param {string} params.hashFile - Absolute path to .enc.sha256 file
 * @param {string} params.bucketName - S3 bucket name
 * @returns {Promise<void>}
 * @throws {Error} If any upload fails.
 */
const uploadBackupToS3 = async ({
  encryptedFile,
  ivFile,
  hashFile,
  bucketName,
}) => {
  const s3KeyEnc = `backups/${path.basename(encryptedFile)}`;
  const s3KeyIv = `backups/${path.basename(ivFile)}`;
  const s3KeyHash = `backups/${path.basename(hashFile)}`;

  await uploadFileToS3(encryptedFile, bucketName, s3KeyEnc, 'application/gzip');
  await uploadFileToS3(ivFile, bucketName, s3KeyIv, 'application/octet-stream');
  await uploadFileToS3(hashFile, bucketName, s3KeyHash, 'text/plain');

  logSystemInfo('Backup files uploaded to S3', {
    context: 'backup-upload',
    files: [s3KeyEnc, s3KeyIv, s3KeyHash],
  });
};

/**
 * Deletes old backup groups from S3 exceeding the retention limit.
 *
 * Groups S3 objects by timestamp tolerance (to associate .enc, .iv, and
 * .sha256 files as a single backup copy), sorts by age, and deletes
 * the oldest groups beyond `maxBackups`.
 *
 * @param {Object} params
 * @param {string} params.bucketName - S3 bucket name
 * @param {number} params.maxBackups - Number of backup copies to retain
 * @param {number} params.toleranceMs - Timestamp tolerance in ms for grouping
 * @returns {Promise<number>} Number of deleted S3 objects
 */
const cleanupS3Backups = async ({ bucketName, maxBackups, toleranceMs }) => {
  const files = await listFilesInS3(bucketName, 'backups/');

  // Each group = one backup copy (typically 3 objects: .enc, .iv, .sha256)
  const groups = groupFilesWithTolerance(files, toleranceMs);

  if (groups.length <= maxBackups) return 0;

  //--------------------------------------------------
  // Precompute timestamps (avoid repeated calculation)
  //--------------------------------------------------
  const groupsWithTs = groups.map((group) => ({
    group,
    ts: getGroupTimestamp(group),
  }));

  // Oldest first — delete from the front
  groupsWithTs.sort((a, b) => a.ts - b.ts);

  //--------------------------------------------------
  // Determine groups to delete
  //--------------------------------------------------
  const excessCount = groupsWithTs.length - maxBackups;
  const groupsToDelete = groupsWithTs.slice(0, excessCount).map((g) => g.group);

  //--------------------------------------------------
  // Flatten keys for deletion
  //--------------------------------------------------
  const keysToDelete = groupsToDelete.flatMap((g) =>
    g.files.map((f) => ({ Key: f.Key }))
  );

  // S3 DeleteObjects limit: 1000 per request
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
