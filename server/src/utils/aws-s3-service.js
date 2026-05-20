/**
 * @file aws-s3-service.js
 * @description S3 access layer for the WideNaturals ERP system.
 *
 * Provides high-level operations over the AWS SDK v3 S3 client:
 *   - File/buffer upload (with multipart auto-switch via lib-storage for large bodies)
 *   - File download (to disk or memory)
 *   - Object deletion (single + batch)
 *   - Listing (folder enumeration + backup grouping, with pagination)
 *   - Existence check (HeadObject, metadata only)
 *   - Presigned URL generation (GET/PUT)
 *   - Environment-aware image URL resolution
 *
 * Error-handling conventions follow the project-wide single-log principle:
 *   - This module does NOT log exceptions in catch blocks. Errors propagate
 *     to `globalErrorHandler`, which is the single source of error logs.
 *   - AppErrors thrown upstream are passed through unchanged
 *     via `if (error instanceof AppError) throw error;`.
 *   - SDK errors are wrapped with `AppError.serviceError` so the global
 *     handler receives a consistent, structured error shape with `cause`.
 *
 * The retry helper is the explicit exception to the single-log rule: it logs
 * each retry attempt for fault-tolerance visibility, in the same spirit as
 * the `Promise.allSettled` exception in `sku-image-service.js`. Final
 * failures propagate without logging — `globalErrorHandler` logs them once.
 *
 * Production policy alignment:
 *   - All uploads request server-side encryption (SSE-S3 / AES256 by default).
 *   - All bucket interactions go through the shared S3Client singleton,
 *     which is constructed once at bootstrap with validated credentials.
 *   - Pagination is honoured on list operations (S3 caps ListObjectsV2 at
 *     1000 keys per response).
 */

const fs = require('fs');
const fsp = require('fs/promises');
const {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3-client');
const AppError = require('./AppError');
const { logSystemInfo } = require('./logging/system-logger');

const CONTEXT = 'aws-s3-service';

// Server-side encryption mode applied to all uploads. Switch to 'aws:kms'
// (with SSEKMSKeyId) if the bucket policy mandates KMS.
const DEFAULT_SSE = 'AES256';

// Retry tuning. Exponential backoff with jitter; capped to avoid unbounded waits.
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;
const RETRY_MAX_MS = 8000;

// Streams above this threshold use multipart upload via @aws-sdk/lib-storage.
const MULTIPART_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Computes an exponential backoff delay with jitter.
 *
 * @param {number} attempt - 1-indexed attempt number.
 * @returns {number} Delay in milliseconds.
 */
const computeBackoffMs = (attempt) => {
  const exp = Math.min(RETRY_BASE_MS * 2 ** (attempt - 1), RETRY_MAX_MS);
  // Full jitter: random between 0 and exp. Avoids synchronized retry storms.
  return Math.floor(Math.random() * exp);
};

/**
 * Executes an S3 command with bounded retries and exponential backoff with jitter.
 *
 * Logs each retry attempt for ops visibility (this is the fault-tolerance
 * exception to the single-log principle). Does NOT log the terminal failure —
 * propagates the error so `globalErrorHandler` logs it once.
 *
 * @template T
 * @param {() => Promise<T>} s3Command - Thunk returning the S3 command promise.
 * @param {number} [maxRetries=DEFAULT_MAX_RETRIES] - Maximum retry count.
 * @returns {Promise<T>} The successful response.
 */
const executeWithRetry = async (s3Command, maxRetries = DEFAULT_MAX_RETRIES) => {
  const context = `${CONTEXT}/executeWithRetry`;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await s3Command();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) break;
      
      const nextRetryInMs = computeBackoffMs(attempt);
      logSystemInfo('S3 operation failed; will retry', {
        context,
        attempt,
        maxRetries,
        nextRetryInMs,
        errorName: error?.name,
      });
      await new Promise((resolve) => setTimeout(resolve, nextRetryInMs));
    }
  }
  
  // Propagate without logging — globalErrorHandler logs once.
  throw lastError;
};

/**
 * Internal helper: rethrow AppErrors unchanged, wrap everything else.
 *
 * @param {unknown} error - Caught error.
 * @param {string} message - Service-level message for the wrapper.
 * @param {Object} [meta] - Structured metadata attached to the AppError.
 * @returns {never}
 */
const rethrowAsServiceError = (error, message, meta) => {
  if (error instanceof AppError) throw error;
  throw AppError.serviceError(message, { cause: error, ...meta });
};

/**
 * Uploads a file from disk to S3. Switches to multipart upload automatically
 * for files larger than {@link MULTIPART_THRESHOLD_BYTES} via lib-storage.
 *
 * @param {string} filePath - Absolute path of the local file.
 * @param {string} bucketName - Target S3 bucket.
 * @param {string} key - S3 object key.
 * @param {string} [contentType='application/octet-stream'] - MIME type.
 * @returns {Promise<Object>} S3 response (PutObject or CompleteMultipartUpload).
 * @throws {AppError} If validation fails or the SDK call errors.
 */
const uploadFileToS3 = async (
  filePath,
  bucketName,
  key,
  contentType = 'application/octet-stream'
) => {
  const context = `${CONTEXT}/uploadFileToS3`;
  
  if (!bucketName || !filePath || !key) {
    throw AppError.validationError(
      'bucketName, filePath, and key are required',
      { context, bucketName, key, filePath }
    );
  }
  
  try {
    // Async existence + size check; avoids blocking sync I/O.
    const stat = await fsp.stat(filePath);
    
    const commonParams = {
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: DEFAULT_SSE,
    };
    
    let response;
    if (stat.size > MULTIPART_THRESHOLD_BYTES) {
      // Multipart for large files — handles part chunking, retries, and
      // ordering. lib-storage retries individual parts internally, so
      // we don't wrap it in executeWithRetry.
      const upload = new Upload({
        client: s3Client,
        params: { ...commonParams, Body: fs.createReadStream(filePath) },
      });
      response = await upload.done();
    } else {
      response = await executeWithRetry(() =>
        s3Client.send(
          new PutObjectCommand({
            ...commonParams,
            Body: fs.createReadStream(filePath),
          })
        )
      );
    }
    
    logSystemInfo('Uploaded file to S3', {
      context,
      bucketName,
      key,
      sizeBytes: stat.size,
      multipart: stat.size > MULTIPART_THRESHOLD_BYTES,
    });
    
    return response;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw AppError.validationError(`File not found at path: ${filePath}`, {
        context,
        filePath,
      });
    }
    rethrowAsServiceError(error, 'S3 file upload failed', {
      context,
      bucketName,
      key,
    });
  }
};

/**
 * Uploads an in-memory buffer to S3.
 *
 * @param {string} bucketName - Target S3 bucket.
 * @param {string} key - S3 object key.
 * @param {Buffer} buffer - Body to upload.
 * @param {string} contentType - MIME type.
 * @returns {Promise<{ key: string, contentType: string }>} Lean result.
 * @throws {AppError} If validation fails or the SDK call errors.
 */
const uploadBufferToS3 = async (bucketName, key, buffer, contentType) => {
  const context = `${CONTEXT}/uploadBufferToS3`;
  
  if (!bucketName || !key || !Buffer.isBuffer(buffer) || !contentType) {
    throw AppError.validationError(
      'bucketName, key, buffer (Buffer), and contentType are required',
      { context, bucketName, key, contentType }
    );
  }
  
  try {
    await executeWithRetry(() =>
      s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ServerSideEncryption: DEFAULT_SSE,
        })
      )
    );
    return { key, contentType };
  } catch (error) {
    rethrowAsServiceError(error, 'S3 buffer upload failed', {
      context,
      bucketName,
      key,
    });
  }
};

/**
 * Downloads an object from S3 either to a local file or into memory.
 *
 * @param {string} bucketName - Source S3 bucket.
 * @param {string} key - S3 object key.
 * @param {string|null} [downloadPath=null] - Local destination path. If null,
 *   the body is returned in memory.
 * @param {boolean} [asString=false] - When returning in memory, decode as UTF-8.
 * @returns {Promise<Buffer|string|null>} Buffer/string when in-memory, or null
 *   when written to disk.
 * @throws {AppError} If validation fails or the SDK call errors.
 */
const downloadFileFromS3 = async (
  bucketName,
  key,
  downloadPath = null,
  asString = false
) => {
  const context = `${CONTEXT}/downloadFileFromS3`;
  
  if (!bucketName || !key) {
    throw AppError.validationError('bucketName and key are required', {
      context,
    });
  }
  
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );
    
    if (downloadPath) {
      const writeStream = fs.createWriteStream(downloadPath);
      await new Promise((resolve, reject) => {
        response.Body.pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });
      return null;
    }
    
    const chunks = [];
    for await (const chunk of response.Body) chunks.push(chunk);
    const data = Buffer.concat(chunks);
    return asString ? data.toString('utf-8') : data;
  } catch (error) {
    rethrowAsServiceError(error, 'S3 download failed', {
      context,
      bucketName,
      key,
    });
  }
};

/**
 * Deletes a single object from S3.
 *
 * @param {string} bucketName - Target S3 bucket.
 * @param {string} key - Object key.
 * @returns {Promise<void>}
 * @throws {AppError} If validation fails or the SDK call errors.
 */
const deleteFileFromS3 = async (bucketName, key) => {
  const context = `${CONTEXT}/deleteFileFromS3`;
  
  if (!bucketName || !key) {
    throw AppError.validationError('bucketName and key are required', {
      context,
    });
  }
  
  try {
    await executeWithRetry(() =>
      s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
    );
  } catch (error) {
    rethrowAsServiceError(error, 'S3 delete failed', {
      context,
      bucketName,
      key,
    });
  }
};

/**
 * Deletes multiple objects from S3 in a single batch request. S3 caps each
 * `DeleteObjects` call at 1000 keys; this helper chunks transparently.
 *
 * @param {string} bucketName - Target S3 bucket.
 * @param {string[]} keys - Object keys to delete.
 * @returns {Promise<void>}
 * @throws {AppError} If validation fails or the SDK call errors.
 */
const deleteFilesFromS3 = async (bucketName, keys) => {
  const context = `${CONTEXT}/deleteFilesFromS3`;
  
  if (!bucketName || !Array.isArray(keys) || keys.length === 0) {
    throw AppError.validationError(
      'bucketName and a non-empty keys array are required',
      { context, keyCount: Array.isArray(keys) ? keys.length : 0 }
    );
  }
  
  try {
    // S3 caps DeleteObjects at 1000 keys per request.
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
      const chunk = keys.slice(i, i + CHUNK_SIZE);
      await executeWithRetry(() =>
        s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            // SDK requires `{ Key: string }`, not raw strings.
            Delete: { Objects: chunk.map((k) => ({ Key: k })) },
          })
        )
      );
    }
  } catch (error) {
    rethrowAsServiceError(error, 'S3 batch delete failed', {
      context,
      bucketName,
      keyCount: keys.length,
    });
  }
};

/**
 * Lists all objects under a prefix, handling pagination transparently.
 *
 * @param {string} bucketName - Target S3 bucket.
 * @param {string} prefix - Object key prefix (e.g. 'backups/').
 * @returns {Promise<Array<import('@aws-sdk/client-s3')._Object>>} All objects under the prefix.
 * @throws {AppError} If the SDK call errors.
 */
const listFilesInS3 = async (bucketName, prefix) => {
  const context = `${CONTEXT}/listFilesInS3`;
  
  if (!bucketName) {
    throw AppError.validationError('bucketName is required', { context });
  }
  
  try {
    const all = [];
    let continuationToken;
    
    do {
      const response = await executeWithRetry(() =>
        s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        )
      );
      if (response.Contents?.length) all.push(...response.Contents);
      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);
    
    return all;
  } catch (error) {
    rethrowAsServiceError(error, 'S3 list failed', {
      context,
      bucketName,
      prefix,
    });
  }
};

/**
 * Lists backups from a folder, sorted by `LastModified` (newest first) and
 * grouped per backup set in `.enc -> .iv -> .sha256` order.
 *
 * @param {string} bucketName - Target S3 bucket.
 * @param {string} [folderPrefix='backups/'] - Folder prefix.
 * @returns {Promise<Array<{ Key: string, LastModified: Date, Size: number }>>}
 * @throws {AppError} If validation fails or the SDK call errors.
 */
const listBackupsFromS3 = async (bucketName, folderPrefix = 'backups/') => {
  const context = `${CONTEXT}/listBackupsFromS3`;
  
  if (!bucketName) {
    throw AppError.validationError('bucketName is required', { context });
  }
  
  try {
    // Reuse the paginated lister.
    const all = await listFilesInS3(bucketName, folderPrefix);
    if (all.length === 0) return [];
    
    const backups = all
      .filter((item) => item.Key.startsWith(folderPrefix) && item.Size > 0)
      .map((item) => ({
        Key: item.Key,
        LastModified: new Date(item.LastModified),
        Size: item.Size,
      }))
      .sort((a, b) => b.LastModified - a.LastModified);
    
    // Group by base name (regex now correctly strips .enc as well).
    const groupedBackups = backups.reduce((acc, item) => {
      const baseName = item.Key.replace(/\.(enc|iv|sha256)$/, '');
      if (!acc[baseName]) acc[baseName] = [];
      acc[baseName].push(item);
      return acc;
    }, {});
    
    const order = { enc: 0, iv: 1, sha256: 2 };
    return Object.values(groupedBackups).flatMap((group) =>
      group.sort(
        (a, b) =>
          (order[a.Key.split('.').pop()] ?? 99) -
          (order[b.Key.split('.').pop()] ?? 99)
      )
    );
  } catch (error) {
    rethrowAsServiceError(error, 'S3 backup listing failed', {
      context,
      bucketName,
      folderPrefix,
    });
  }
};

/**
 * Checks object existence via `HeadObject` (metadata only, no body transfer).
 *
 * @param {string} bucketName - Target S3 bucket.
 * @param {string} key - Object key.
 * @returns {Promise<boolean>} True if the object exists.
 * @throws {AppError} For non-404 errors.
 */
const s3ObjectExists = async (bucketName, key) => {
  const context = `${CONTEXT}/s3ObjectExists`;
  
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: bucketName, Key: key })
    );
    return true;
  } catch (error) {
    if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    rethrowAsServiceError(error, 'S3 existence check failed', {
      context,
      bucketName,
      key,
    });
  }
};

/**
 * Generates a time-limited presigned GET URL for a private S3 object.
 *
 * @param {string} bucketName - Source S3 bucket.
 * @param {string} key - Object key.
 * @param {number} [expiresInSeconds=3600] - Lifetime in seconds (default 1h).
 * @returns {Promise<string>} Presigned URL.
 * @throws {AppError} If validation fails or presigning errors.
 */
const getPresignedDownloadUrl = async (
  bucketName,
  key,
  expiresInSeconds = 3600
) => {
  const context = `${CONTEXT}/getPresignedDownloadUrl`;
  
  if (!bucketName || !key) {
    throw AppError.validationError('bucketName and key are required', {
      context,
    });
  }
  
  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    rethrowAsServiceError(error, 'Presigned download URL generation failed', {
      context,
      bucketName,
      key,
    });
  }
};

/**
 * Generates a time-limited presigned PUT URL for direct-from-browser uploads.
 *
 * @param {string} bucketName - Target S3 bucket.
 * @param {string} key - Object key.
 * @param {string} contentType - MIME type the browser will upload.
 * @param {number} [expiresInSeconds=300] - Lifetime in seconds (default 5m).
 * @returns {Promise<string>} Presigned URL.
 * @throws {AppError} If validation fails or presigning errors.
 */
const getPresignedUploadUrl = async (
  bucketName,
  key,
  contentType,
  expiresInSeconds = 300
) => {
  const context = `${CONTEXT}/getPresignedUploadUrl`;
  
  if (!bucketName || !key || !contentType) {
    throw AppError.validationError(
      'bucketName, key, and contentType are required',
      { context }
    );
  }
  
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: DEFAULT_SSE,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    rethrowAsServiceError(error, 'Presigned upload URL generation failed', {
      context,
      bucketName,
      key,
    });
  }
};

/**
 * Resolves a stored image key to a fetchable URL.
 *
 * Production: time-limited presigned URL against the configured images bucket.
 * Development: relative path served by Express static from `public/uploads/`.
 *
 * @param {string|null|undefined} key - DB-stored key (e.g. 'sku-images/AB/hash/file.webp').
 * @param {Object} [options]
 * @param {string} [options.bucketName=process.env.AWS_S3_IMAGES_BUCKET] - Target bucket.
 * @param {number} [options.expiresInSeconds=3600] - URL lifetime in production.
 * @returns {Promise<string|null>} URL, or null when no key supplied.
 */
const resolveImageUrl = async (
  key,
  {
    bucketName = process.env.AWS_S3_IMAGES_BUCKET,
    expiresInSeconds = 3600,
  } = {}
) => {
  if (!key) return null;
  
  if (process.env.NODE_ENV === 'production') {
    return getPresignedDownloadUrl(bucketName, key, expiresInSeconds);
  }
  return `/uploads/${key}`;
};

/**
 * Resolves image key fields on a list of items to URL form.
 *
 * Pure: input items are not mutated. Failed resolutions throw — wrap the
 * caller in `Promise.allSettled` if partial failure should be tolerated.
 *
 * @template T
 * @param {T[]} items
 * @param {(keyof T)[]} fieldNames - Fields holding keys to resolve.
 * @returns {Promise<T[]>}
 */
const resolveImageUrlsOnItems = async (items, fieldNames) =>
  Promise.all(
    items.map(async (item) => {
      const resolved = { ...item };
      await Promise.all(
        fieldNames.map(async (field) => {
          if (resolved[field]) {
            resolved[field] = await resolveImageUrl(resolved[field]);
          }
        })
      );
      return resolved;
    })
  );

module.exports = {
  uploadFileToS3,
  uploadBufferToS3,
  downloadFileFromS3,
  deleteFileFromS3,
  deleteFilesFromS3,
  listFilesInS3,
  listBackupsFromS3,
  s3ObjectExists,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  resolveImageUrl,
  resolveImageUrlsOnItems,
};
