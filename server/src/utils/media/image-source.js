const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const net = require('net');
const AppError = require('../AppError');
const { retry } = require('../../database/db');
const { logSystemException, logSystemWarn } = require('../system-logger');
const { ALLOWED_IMAGE_HOSTS } = require('../constants/security/media-security-constants');

const ROOT_DIR = path.resolve(__dirname, '../../../');

/**
 * @function
 *
 * @description
 * Determines whether a value is a valid HTTP(S) URL.
 *
 * This performs structural validation using the WHATWG URL parser
 * and ensures the protocol is either http or https.
 *
 * @param {string} value
 * @returns {boolean}
 */
const isRemoteUrl = (value) => {
  if (typeof value !== 'string') return false;
  
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * @async
 * @function
 *
 * @description
 * Resolves an image source into a local filesystem path.
 *
 * Supports:
 *   • Remote HTTP(S) URLs (downloaded temporarily)
 *   • Absolute local file paths
 *   • Relative project paths
 *
 * Security:
 *   • Enforces hostname allow-list for remote URLs
 *   • Rejects empty allow-list (remote fetching disabled)
 *   • Blocks localhost and IP-based hosts (IPv4 & IPv6)
 *   • Prevents SSRF via strict host validation
 *   • Supports subdomain matching for approved domains
 *
 * This function:
 *   • Does perform network IO (for remote URLs)
 *   • Does perform filesystem IO
 *   • Preserves AppError types
 *
 * Temp files are created under <project>/temp and must be cleaned
 * by the calling service after processing.
 *
 * @param {string} src
 * @param {string} skuCode
 * @returns {Promise<string>} absolute local file path
 *
 * @throws {AppError}
 *   ValidationError for invalid inputs or untrusted hosts
 *   FileSystemError for IO failures
 */
const resolveSource = async (src, skuCode) => {
  const context = 'image-source/resolveSource';
  
  if (!src || typeof src !== 'string') {
    throw AppError.validationError('Invalid image source');
  }
  
  try {
    // ------------------------------------------------------------
    // Remote URL handling
    // ------------------------------------------------------------
    if (isRemoteUrl(src)) {
      const url = new URL(src);
      const hostname = url.hostname.toLowerCase();
      
      // Remote fetching must be explicitly enabled
      if (!ALLOWED_IMAGE_HOSTS.length) {
        throw AppError.validationError(
          'Remote image fetching is not enabled.'
        );
      }
      
      // Block localhost explicitly
      if (hostname === 'localhost') {
        throw AppError.validationError('Localhost is not allowed.');
      }
      
      // Block direct IP access (prevents SSRF via numeric IP)
      if (net.isIP(hostname)) {
        throw AppError.validationError('IP-based hosts are not allowed.');
      }
      
      // Enforce allow-list
      const isAllowed = ALLOWED_IMAGE_HOSTS.some(
        (host) =>
          hostname === host || hostname.endsWith(`.${host}`)
      );
      
      if (!isAllowed) {
        logSystemWarn('Blocked untrusted image host', {
          hostname,
          allowedHosts: ALLOWED_IMAGE_HOSTS,
        });
        throw AppError.validationError('Untrusted image host');
      }
      
      const tempDir = path.join(
        ROOT_DIR,
        'temp',
        `${skuCode}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`
      );
      
      await fsp.mkdir(tempDir, { recursive: true });
      
      const filename = path.basename(url.pathname);
      const tempFile = path.join(tempDir, filename);
      
      const response = await retry(() => fetch(src), 3);
      
      if (!response.ok || !response.body) {
        throw AppError.fileSystemError('Failed to fetch image', {
          status: response.status,
        });
      }
      
      await new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(tempFile);
        response.body.pipe(stream);
        stream.on('finish', () => resolve());
        stream.on('error', (err) => reject(err));
      });
      
      return tempFile;
    }
    
    // ------------------------------------------------------------
    // Local path handling
    // ------------------------------------------------------------
    const resolvedPath = path.isAbsolute(src)
      ? src
      : path.resolve(ROOT_DIR, src);
    
    await fsp.access(resolvedPath);
    
    return resolvedPath;
  } catch (error) {
    logSystemException(error, 'Failed to resolve image source', {
      context,
      skuCode,
      src,
    });
    
    // Preserve AppError subclasses
    if (error instanceof AppError) {
      throw error;
    }
    
    throw AppError.fileSystemError(
      'Failed to resolve image source',
      { cause: error }
    );
  }
};

/**
 * @function
 *
 * @description
 * Extracts a candidate image source URL from an image object.
 *
 * This function:
 *   • Performs NO validation
 *   • Performs NO IO
 *   • Performs NO security checks
 *
 * It only determines whether a string source exists and should be
 * passed to resolveSource() for further processing.
 *
 * Host validation, protocol validation, and IO resolution are handled
 * by resolveSource().
 *
 * @param {Object} image
 * @returns {string|null}
 */
const detectImageSource = (image) => {
  if (!image || typeof image !== 'object') {
    return null;
  }
  
  const { image_url } = image;
  
  if (typeof image_url !== 'string') {
    return null;
  }
  
  const trimmed = image_url.trim();
  
  return trimmed.length > 0 ? trimmed : null;
};

module.exports = {
  isRemoteUrl,
  resolveSource,
  detectImageSource,
};
