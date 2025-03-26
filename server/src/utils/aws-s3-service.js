const { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const s3Client = require('../config/aws-s3-config');
const { logInfo, logError } = require('./logger-helper');

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
      logInfo(`S3 operation successful.`);
      return response;
    } catch (error) {
      attempt++;
      logError(`S3 operation failed (Attempt ${attempt}): ${error.message}`);
      
      if (attempt >= maxRetries) {
        logError('Max retries reached. Giving up.');
        throw error;  // Throw the error if all attempts fail
      }
      
      logInfo(`Retrying operation (${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2 seconds before retrying
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
const uploadFileToS3 = async (filePath, bucketName, key, contentType = 'application/octet-stream') => {
  // Basic validation of inputs
  if (!bucketName) throw new Error('Bucket name is required.');
  if (!filePath) throw new Error('File path is required.');
  if (!key) throw new Error('Key is required.');
  
  try {
    // Check if file exists before attempting to upload
    if (!fs.existsSync(filePath)) {
      logError(`File not found at path: ${filePath}`);
      throw new Error(`File not found at path: ${filePath}`);
    }
    
    // Read file as a stream
    const fileStream = fs.createReadStream(filePath);
    
    // Listen for stream errors
    fileStream.on('error', (err) => {
      logError(`File stream error for ${filePath}: ${err.message}`);
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
    const response = await executeWithRetry(() => s3Client.send(new PutObjectCommand(uploadParams)));
    
    logInfo(`Successfully uploaded ${filePath} to S3 as ${key}.`);
    return response;
  } catch (error) {
    logError('Upload failed:', error.message);
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
const downloadFileFromS3 = async (bucketName, key, downloadPath = null, asString = false) => {
  try {
    logInfo(`Attempting to download file from S3: ${key}`);
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3Client.send(command);
    
    if (downloadPath) {
      const writeStream = fs.createWriteStream(downloadPath);
      await new Promise((resolve, reject) => {
        response.Body.pipe(writeStream)
          .on('finish', () => {
            logInfo(`Successfully downloaded and saved file: ${downloadPath}`);
            resolve();
          })
          .on('error', (error) => {
            logError(`Failed to download file from S3: ${key} - ${error.message}`);
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
      logInfo(`Successfully downloaded file: ${key}`);
      return asString ? data.toString('utf-8') : data;
    }
  } catch (error) {
    logError(`Failed to download file from S3: ${key} - ${error.message}`);
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
  if (!bucketName || !key) {
    logError('Missing required parameters for deletion.');
    throw new Error('Bucket name and key are required.');
  }
  
  try {
    logInfo(`Deleting file from S3: ${key}`);
    
    await executeWithRetry(() => s3Client.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: key })
    ));
    
    logInfo(`Successfully deleted file from S3: ${key}`);
  } catch (error) {
    logError(`Failed to delete file from S3: ${error.message}`);
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
  if (!bucketName || !Array.isArray(keys) || keys.length === 0) {
    logError('Missing required parameters or empty keys array for bulk deletion.');
    throw new Error('Bucket name and a non-empty keys array are required.');
  }
  
  try {
    logInfo(`Deleting ${keys.length} files from S3...`);
    
    const deleteParams = {
      Bucket: bucketName,
      Delete: { Objects: keys }
    };
    
    await executeWithRetry(() => s3Client.send(new DeleteObjectsCommand(deleteParams)));
    
    logInfo(`Successfully deleted ${keys.length} files from S3.`);
  } catch (error) {
    logError(`Failed to delete files from S3: ${error.message}`);
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
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    
    const response = await executeWithRetry(() => s3Client.send(command));
    return response.Contents || [];
  } catch (error) {
    logError(`Failed to list files in S3: ${error.message}`);
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
  try {
    if (!bucketName) {
      throw new Error('Bucket name is required.');
    }
    
    logInfo(`Fetching backups from folder: ${folderPrefix}`);
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      logInfo('No backups found in the specified folder.');
      return [];
    }
    
    const backups = response.Contents
      .filter(item => item.Key.startsWith(folderPrefix) && item.Size > 0) // Ignore folders
      .map(item => ({
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
    
    const sortedGroupedBackups = Object.values(groupedBackups).flatMap(group =>
      group.sort((a, b) => {
        const aExt = a.Key.split('.').pop();
        const bExt = b.Key.split('.').pop();
        
        const order = { 'enc': 0, 'iv': 1, 'sha256': 2 };
        return (order[aExt] ?? 99) - (order[bExt] ?? 99);
      })
    );
    
    logInfo(`Found ${sortedGroupedBackups.length} backup(s) in the folder: ${folderPrefix}`);
    return sortedGroupedBackups;
  } catch (error) {
    logError('Failed to list backups from S3:', error.message);
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
};