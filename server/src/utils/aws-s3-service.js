const {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const s3Client = require('../config/aws-s3-config');
const { logInfo, logError } = require('./logger-helper');
const { logSystemInfo, logSystemError } = require('./system-logger');

/**
 * Generic S3 operation with retry logic.
 * @param {Function} s3Command - The S3 command to execute.
 * @param {number} maxRetries - Maximum number of retries on failure.
 * @returns {Promise<any>}
 */
const executeWithRetry = async (s3Command, maxRetries = 3) => {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await s3Command();
      logSystemInfo('S3 operation successful.', {
        context: 's3-retry',
        attempt,
      });
      return response;
    } catch (error) {
      attempt++;
      logSystemError('S3 operation failed', {
        context: 's3-retry',
        attempt,
        errorMessage: error.message,
      });

      if (attempt >= maxRetries) {
        logSystemError('Max retries reached. Giving up.', {
          context: 's3-retry',
          attempt,
        });
        throw error; // Throw the error if all attempts fail
      }

      logSystemInfo('Retrying S3 operation...', {
        context: 's3-retry',
        attempt,
        maxRetries,
        nextRetryInMs: 2000,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }
  }
};

/**
 * Upload a file to AWS S3.
 *
 * @param {string} filePath - The path of the file to upload.
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} key - The key (path) to save the file as in S3.
 * @param {string} [contentType='application/octet-stream'] - The content type of the file (optional).
 * @returns {Promise<Object>} - The response from S3.
 * @throws {Error} - Throws error if upload fails.
 */
const uploadFileToS3 = async (
  filePath,
  bucketName,
  key,
  contentType = 'application/octet-stream'
) => {
  const context = 'uploadFileToS3';

  // Input validation
  if (!bucketName || !filePath || !key) {
    const missing = [
      !bucketName && 'bucketName',
      !filePath && 'filePath',
      !key && 'key',
    ]
      .filter(Boolean)
      .join(', ');
    logSystemError(`Missing required parameter(s): ${missing}`, { context });
    throw new Error(`Missing required parameter(s): ${missing}`);
  }

  try {
    // Check if file exists before attempting to upload
    if (!fs.existsSync(filePath)) {
      logSystemError(`File not found at path: ${filePath}`, { context });
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Read a file as a stream
    const fileStream = fs.createReadStream(filePath);

    // Listen for stream errors
    fileStream.on('error', (err) => {
      logSystemError(`File stream error for ${filePath}: ${err.message}`, {
        context,
        filePath,
      });
      throw new Error(`File stream error: ${err.message}`);
    });

    // Prepare upload parameters
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    };

    // Upload to S3 using the executeWithRetry function
    const response = await executeWithRetry(() =>
      s3Client.send(new PutObjectCommand(uploadParams))
    );

    logSystemInfo(`Successfully uploaded file to S3`, {
      context,
      bucketName,
      key,
      filePath,
    });

    return response;
  } catch (error) {
    logSystemError('Upload to S3 failed', {
      context,
      filePath,
      bucketName,
      key,
      errorMessage: error.message,
    });

    throw error;
  }
};

/**
 * Downloads a file from S3.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} key - The S3 key of the file to download.
 * @param {string|null} downloadPath - The local path to save the file. If null, returns the file as Buffer/String.
 * @param {boolean} asString - If true, returns file as a UTF-8 string. Otherwise, returns as Buffer.
 * @returns {Promise<Buffer|string|null>}
 */
const downloadFileFromS3 = async (
  bucketName,
  key,
  downloadPath = null,
  asString = false
) => {
  const context = 's3-download';
  const meta = { context, bucket: bucketName, key, downloadPath };

  try {
    logSystemInfo(`Attempting to download file from S3`, meta);

    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3Client.send(command);

    if (downloadPath) {
      const writeStream = fs.createWriteStream(downloadPath);
      await new Promise((resolve, reject) => {
        response.Body.pipe(writeStream)
          .on('finish', () => {
            logSystemInfo(`File saved to disk`, {
              ...meta,
              filePath: downloadPath,
            });
            resolve();
          })
          .on('error', (error) => {
            logSystemError(`Stream error during download`, {
              ...meta,
              error: error.message,
            });
            reject(error);
          });
      });
      return null;
    } else {
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);
      logSystemInfo(`File successfully downloaded into memory`, meta);
      return asString ? data.toString('utf-8') : data;
    }
  } catch (error) {
    logSystemError(`Failed to download file from S3`, meta);
    throw error;
  }
};

/**
 * Deletes a single file from S3 with retry logic.
 * @param {string} bucketName - The S3 bucket name.
 * @param {string} key - The key (path) of the file to delete.
 * @returns {Promise<void>}
 */
const deleteFileFromS3 = async (bucketName, key) => {
  const context = 's3-delete-single';
  const meta = { context, bucket: bucketName, key };

  if (!bucketName || !key) {
    logSystemError('Missing required parameters for deletion.', meta);
    throw new Error('Bucket name and key are required.');
  }

  try {
    logSystemInfo('Deleting file from S3...', meta);

    await executeWithRetry(() =>
      s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
    );

    logSystemInfo('File deleted from S3 successfully.', meta);
  } catch (error) {
    logSystemError('Failed to delete file from S3.', meta);
    throw error;
  }
};

/**
 * Deletes multiple files from S3 with retry logic.
 * @param {string} bucketName - The S3 bucket name.
 * @param {Array<string>} keys - An array of keys to delete from S3.
 * @returns {Promise<void>}
 */
const deleteFilesFromS3 = async (bucketName, keys) => {
  const context = 's3-delete-multiple';
  const meta = { context, bucket: bucketName, keys };

  if (!bucketName || !Array.isArray(keys) || keys.length === 0) {
    logSystemError('Missing required parameters or empty keys array.', meta);
    throw new Error('Bucket name and a non-empty keys array are required.');
  }

  try {
    logSystemInfo(`Deleting ${keys.length} files from S3...`, meta);

    const deleteParams = {
      Bucket: bucketName,
      Delete: { Objects: keys },
    };

    await executeWithRetry(() =>
      s3Client.send(new DeleteObjectsCommand(deleteParams))
    );

    logSystemInfo('Batch file deletion from S3 completed.', meta);
  } catch (error) {
    logSystemError('Failed to delete multiple files from S3.', meta);
    throw error;
  }
};

/**
 * Lists objects in a specified S3 bucket folder with retry logic.
 * @param {string} bucketName - The S3 bucket name.
 * @param {string} prefix - The folder prefix (e.g., 'backups/').
 * @returns {Promise<Array>} - List of files in the specified folder.
 */
const listFilesInS3 = async (bucketName, prefix) => {
  const context = 's3-list-files';
  const meta = { context, bucket: bucketName, prefix };

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await executeWithRetry(() => s3Client.send(command));

    logSystemInfo(`Listed S3 objects successfully.`, {
      ...meta,
      fileCount: response?.Contents?.length || 0,
    });

    return response.Contents || [];
  } catch (error) {
    logSystemError('Failed to list files in S3.', meta);
    throw error;
  }
};

/**
 * Lists backups from the specified S3 bucket and folder, sorted by LastModified date (latest first)
 * and grouped in the order: .enc -> .iv -> .sha256 for each backup set.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} folderPrefix - The prefix/folder path where backups are stored (default: 'backups/').
 * @returns {Promise<Array>} - Returns an array of backup objects sorted and grouped by type.
 */
const listBackupsFromS3 = async (bucketName, folderPrefix = 'backups/') => {
  const context = 's3-list-backups';
  const meta = { context, bucket: bucketName, folderPrefix };

  try {
    if (!bucketName) {
      logSystemError('Bucket name is required.', meta);
      throw new Error('Bucket name is required.');
    }

    logSystemInfo(`Fetching backups from folder...`, meta);

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      logSystemInfo('No backups found in the specified folder.', meta);
      return [];
    }

    const backups = response.Contents.filter(
      (item) => item.Key.startsWith(folderPrefix) && item.Size > 0
    ) // Ignore folders
      .map((item) => ({
        Key: item.Key,
        LastModified: new Date(item.LastModified), // Convert to Date object
        Size: item.Size,
      }))
      .sort((a, b) => b.LastModified - a.LastModified); // Sort by date in descending order

    // Group by backup set and sort each set by type (.enc -> .iv -> .sha256)
    const groupedBackups = backups.reduce((acc, item) => {
      const baseName = item.Key.replace(/(\.iv|\.sha256)$/, ''); // Remove .iv or .sha256 extension
      if (!acc[baseName]) acc[baseName] = [];
      acc[baseName].push(item);
      return acc;
    }, {});

    const sortedGroupedBackups = Object.values(groupedBackups).flatMap(
      (group) =>
        group.sort((a, b) => {
          const aExt = a.Key.split('.').pop();
          const bExt = b.Key.split('.').pop();

          const order = { enc: 0, iv: 1, sha256: 2 };
          return (order[aExt] ?? 99) - (order[bExt] ?? 99);
        })
    );

    logSystemInfo(`Found ${sortedGroupedBackups.length} backup items.`, {
      ...meta,
      itemCount: sortedGroupedBackups.length,
    });

    return sortedGroupedBackups;
  } catch (error) {
    logSystemError('Failed to list backups from S3.', meta);
    throw error;
  }
};

/**
 * Uploads a SKU image to S3 and returns its public URL.
 *
 * @param {string} bucketName - The S3 bucket name.
 * @param {string} localFilePath - Local file path to upload.
 * @param {string} keyPrefix - The folder/prefix under which to store the image.
 * @param {string|null} keyName - Optional name for the S3 key (uses local filename if not provided).
 * @returns {Promise<string>} - The public S3 URL of the uploaded image.
 */
const uploadSkuImageToS3 = async (
  bucketName,
  localFilePath,
  keyPrefix,
  keyName = null
) => {
  const context = 's3-upload-sku-image';

  if (!bucketName) {
    logSystemError('Missing bucket name.', { context });
    throw new Error('Bucket name is required.');
  }
  try {
    const fileStream = fs.createReadStream(localFilePath);
    const ext = path.extname(localFilePath);
    const contentType = mime.lookup(ext) || 'application/octet-stream';
    const baseFileName = keyName || path.basename(localFilePath);
    const s3Key = `${keyPrefix}/${baseFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    logSystemInfo('SKU image uploaded to S3.', {
      context,
      bucketName,
      s3Key,
      contentType,
      publicUrl,
    });

    return publicUrl;
  } catch (error) {
    logSystemError('Failed to upload SKU image to S3.', {
      context,
      bucketName,
      file: localFilePath,
    });
    throw error;
  }
};

module.exports = {
  uploadFileToS3,
  downloadFileFromS3,
  deleteFileFromS3,
  deleteFilesFromS3,
  listFilesInS3,
  listBackupsFromS3,
  uploadSkuImageToS3,
};
