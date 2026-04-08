/**
 * @file image-source.js
 * @description
 * Image source resolution and detection utilities.
 *
 * Resolves an image source (remote URL or local path) into an absolute
 * local filesystem path suitable for downstream processing. Enforces
 * security controls for remote URLs including host allow-listing and
 * SSRF prevention.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const fsp = require('fs/promises');
const net = require('net');
const dns = require('dns').promises;
const AppError = require('../AppError');
const { retry } = require('../retry/retry');
const { logSystemException, logSystemWarn } = require('../logging/system-logger');
const { ALLOWED_IMAGE_HOSTS } = require('../constants/security/media-security-constants');
const { isRetryableHttpError } = require('../db/db-error-utils');

const ROOT_DIR = path.resolve(__dirname, '../../../');

const isPrivateOrUnsafeIp = (ip) => {
  const ipVersion = net.isIP(ip);
  if (!ipVersion) return true;

  if (ipVersion === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;

    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    if (a >= 224) return true; // multicast/reserved

    return false;
  }

  const normalized = ip.toLowerCase();
  if (normalized === '::1') return true;
  if (normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9')
    || normalized.startsWith('fea') || normalized.startsWith('feb')) return true; // link-local

  return false;
};

const assertHostnameResolvesToPublicIp = async (hostname) => {
  const records = await dns.lookup(hostname, { all: true });

  if (!Array.isArray(records) || records.length === 0) {
    throw AppError.validationError('Unable to resolve remote image host.');
  }

  for (const record of records) {
    if (isPrivateOrUnsafeIp(record.address)) {
      throw AppError.validationError('Resolved host IP is not allowed.');
    }
  }
};

/**
 * Determines whether a value is a valid HTTP(S) URL.
 *
 * Uses the WHATWG URL parser for structural validation and
 * confirms the protocol is http or https.
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
 * Resolves an image source into an absolute local filesystem path.
 *
 * Supports remote HTTP(S) URLs (downloaded to a temp file) and local
 * paths (absolute or relative to project root). Remote URLs are subject
 * to strict security validation before any network IO is attempted.
 *
 * Security controls (remote URLs only):
 *   • Enforces hostname allow-list; rejects unlisted hosts
 *   • Blocks localhost explicitly
 *   • Blocks direct IP access to prevent SSRF
 *   • Supports subdomain matching for approved domains
 *   • Rejects if allow-list is empty (remote fetching disabled)
 *
 * Temp files are written to <project>/temp and must be cleaned up
 * by the caller after processing.
 *
 * @param {string} src - Remote URL or local file path
 * @param {string} skuCode - SKU code used to namespace the temp directory
 * @returns {Promise<string>} Absolute local path to the resolved image file
 * @throws {AppError} ValidationError for invalid inputs or untrusted hosts
 * @throws {AppError} FileSystemError for network or IO failures
 */
const resolveSource = async (src, skuCode) => {
  const context = 'image-source/resolveSource';
  
  if (!src || typeof src !== 'string') {
    throw AppError.validationError('Invalid image source');
  }
  
  // ------------------------------------------------------------
  // Remote URL handling
  // ------------------------------------------------------------
  if (isRemoteUrl(src)) {
    const url = new URL(src);
    const hostname = url.hostname.toLowerCase();
    
    // Validation errors are expected — throw directly without logging
    if (!ALLOWED_IMAGE_HOSTS.length) {
      throw AppError.validationError('Remote image fetching is not enabled.');
    }
    
    if (hostname === 'localhost') {
      throw AppError.validationError('Localhost is not allowed.');
    }

    if (url.username || url.password) {
      throw AppError.validationError('URL credentials are not allowed.');
    }
    
    // Block numeric IPs to prevent SSRF via direct IP access
    if (net.isIP(hostname)) {
      throw AppError.validationError('IP-based hosts are not allowed.');
    }
    
    // Restrict to default HTTP(S) ports to reduce SSRF surface.
    if (url.port && url.port !== '80' && url.port !== '443') {
      throw AppError.validationError('Non-standard ports are not allowed.');
    }
    
    const isAllowed = ALLOWED_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
    
    if (!isAllowed) {
      logSystemWarn('Blocked untrusted image host', {
        context,
        hostname,
        allowedHosts: ALLOWED_IMAGE_HOSTS,
      });
      throw AppError.validationError('Untrusted image host');
    }

    await assertHostnameResolvesToPublicIp(hostname);
    
    // Build a canonical URL from validated components only.
    const sanitizedUrl = `${url.protocol}//${hostname}${url.pathname}${url.search}`;
    
    try {
      const tempDir = path.join(
        ROOT_DIR,
        'temp',
        `${skuCode}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      
      await fsp.mkdir(tempDir, { recursive: true });
      
      const filename = path.basename(url.pathname) || 'image';
      const tempFile = path.join(tempDir, filename);
      
      const response = await retry(
        async () => {
          const res = await fetch(sanitizedUrl, { redirect: 'error' });
          
          if (!res.ok) {
            const error = new Error(`HTTP error: ${res.status}`);
            error.response = res;
            throw error;
          }
          
          return res;
        },
        {
          retries: 3,
          baseDelay: 500,
          shouldRetry: isRetryableHttpError,
        }
      );
      
      if (!response.body) {
        throw AppError.fileSystemError('Fetch returned empty body', { src });
      }
      
      // Native fetch returns a WHATWG ReadableStream — convert to Node Readable
      // before piping to the write stream
      await new Promise((resolve, reject) => {
        const nodeStream = Readable.fromWeb(response.body);
        const writeStream = fs.createWriteStream(tempFile);
        nodeStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      return tempFile;
    } catch (error) {
      logSystemException(error, 'Failed to fetch remote image', {
        context,
        skuCode,
        src,
      });
      
      if (error instanceof AppError) throw error;
      
      throw AppError.fileSystemError('Failed to fetch remote image', {
        cause: error,
      });
    }
  }
  
  // ------------------------------------------------------------
  // Local path handling
  // ------------------------------------------------------------
  try {
    const resolvedPath = path.isAbsolute(src)
      ? src
      : path.resolve(ROOT_DIR, src);
    
    await fsp.access(resolvedPath);
    
    return resolvedPath;
  } catch (error) {
    logSystemException(error, 'Failed to resolve local image path', {
      context,
      skuCode,
      src,
    });
    
    throw AppError.fileSystemError('Failed to resolve local image path', {
      cause: error,
    });
  }
};

/**
 * Extracts a candidate image source string from an image object.
 *
 * Pure extraction only — performs no validation, no IO, and no security
 * checks. The returned value should be passed to resolveSource() for
 * full resolution and security enforcement.
 *
 * @param {Object} image
 * @returns {string|null} Trimmed image_url string, or null if absent or empty
 */
const detectImageSource = (image) => {
  if (!image || typeof image !== 'object') return null;
  
  const { image_url } = image;
  
  if (typeof image_url !== 'string') return null;
  
  const trimmed = image_url.trim();
  
  return trimmed.length > 0 ? trimmed : null;
};

module.exports = {
  isRemoteUrl,
  resolveSource,
  detectImageSource,
};
