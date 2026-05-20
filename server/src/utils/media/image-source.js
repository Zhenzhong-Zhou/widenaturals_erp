/**
 * @file image-source.js
 * @description
 * Image source detection and resolution utilities.
 *
 * Converts an image source, either a remote HTTP(S) URL or an allowed local
 * development/seed path, into a multer-like file object:
 *
 * {
 *   buffer: Buffer,
 *   mimetype: string,
 *   originalname: string
 * }
 *
 * Remote image sources are protected with host allow-listing, SSRF guards,
 * public-IP DNS validation, redirect blocking, retry handling, MIME validation,
 * and hard response-size limits.
 *
 * Local path resolution is intended only for trusted seed, fixture, and
 * development workflows. It should remain disabled unless explicitly enabled.
 */

'use strict';

const path = require('path');
const fsp = require('fs/promises');
const net = require('net');
const dns = require('dns').promises;
const { URL } = require('node:url');
const mime = require('mime-types');
const AppError = require('../AppError');
const { retry } = require('../retry/retry');
const {
  logSystemWarn,
} = require('../logging/system-logger');
const {
  ALLOWED_IMAGE_HOSTS,
} = require('../constants/security/media-security-constants');
const { isRetryableHttpError } = require('../db/db-error-utils');

const CONTEXT = 'image-source';

const ROOT_DIR = path.resolve(__dirname, '../../../');

const MAX_REMOTE_IMAGE_BYTES = (parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

/**
 * Determines whether an IP address is private, local, reserved, or otherwise
 * unsafe for server-side remote image fetching.
 *
 * Used as a defense-in-depth SSRF check after hostname allow-listing.
 *
 * @param {string} ip
 * @returns {boolean}
 */
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
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  )
    return true; // link-local

  return false;
};

/**
 * Verifies that all resolved DNS records for a hostname point to public IPs.
 *
 * @param {string} hostname
 * @returns {Promise<void>}
 * @throws {AppError} When DNS resolution fails or resolves to an unsafe IP.
 */
const assertHostnameResolvesToPublicIp = async (hostname) => {
  let records;
  
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch (error) {
    throw AppError.validationError('Unable to resolve remote image host.', {
      cause: error,
      meta: { context: `${CONTEXT}/assertHostnameResolvesToPublicIp`, hostname },
    });
  }
  
  if (!Array.isArray(records) || records.length === 0) {
    throw AppError.validationError('Unable to resolve remote image host.', {
      meta: { context: `${CONTEXT}/assertHostnameResolvesToPublicIp`, hostname },
    });
  }
  
  for (const record of records) {
    if (isPrivateOrUnsafeIp(record.address)) {
      throw AppError.validationError('Resolved host IP is not allowed.', {
        meta: {
          context: `${CONTEXT}/assertHostnameResolvesToPublicIp`,
          hostname,
          resolvedAddress: record.address,
        },
      });
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
 * Resolve an image source — either a remote URL or a local filesystem path —
 * into the same shape multer produces, so downstream stages don't care where
 * the bytes came from.
 *
 * Remote URLs go through the SSRF-guarded HTTP client:
 *   • host must be in `ALLOWED_IMAGE_HOSTS` (exact or subdomain match)
 *   • localhost, IP literals, URL credentials, and non-standard ports are rejected
 *   • DNS must resolve to a public (non-private, non-loopback) IP
 *   • redirects are disabled; transient failures retried up to 3×
 *   • response body capped at MAX_REMOTE_IMAGE_BYTES (both declared and actual)
 *
 * Local paths are resolved relative to ROOT_DIR when not absolute, and read
 * directly off disk. Used for seed data, fixtures, and dev workflows.
 *
 * @param {string} src - Remote URL or local path. Validated upstream is not assumed.
 * @param {string} skuCode - SKU being processed; included in error meta for traceability.
 * @returns {Promise<ImageFile>}
 * @throws {AppError} `validationError` for any policy rejection (bad host, oversize, etc).
 */
const resolveSource = async (src, skuCode) => {
  const context = `${CONTEXT}/resolveSource`;
  
  if (!src || typeof src !== 'string') {
    throw AppError.validationError('Invalid image source');
  }
  
  // ---------- Remote URL handling ----------
  if (isRemoteUrl(src)) {
    const url = new URL(src);
    const hostname = url.hostname.toLowerCase();
    
    if (!ALLOWED_IMAGE_HOSTS.length) {
      throw AppError.validationError('Remote image fetching is not enabled.');
    }
    if (hostname === 'localhost') {
      throw AppError.validationError('Localhost is not allowed.');
    }
    if (url.username || url.password) {
      throw AppError.validationError('URL credentials are not allowed.');
    }
    if (net.isIP(hostname)) {
      throw AppError.validationError('IP-based hosts are not allowed.');
    }
    if (url.port && url.port !== '80' && url.port !== '443') {
      throw AppError.validationError('Non-standard ports are not allowed.');
    }
    
    const isAllowed = ALLOWED_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
    
    if (!isAllowed) {
      logSystemWarn('Blocked untrusted image host', {
        context, skuCode, hostname, allowedHosts: ALLOWED_IMAGE_HOSTS,
      });
      throw AppError.validationError('Untrusted image host', { meta: { context, skuCode, hostname } });
    }
    
    await assertHostnameResolvesToPublicIp(hostname);
    
    const sanitizedUrl = `${url.protocol}//${hostname}${url.pathname}${url.search}`;
    
    const response = await retry(
      async () => {
        const res = await globalThis.fetch(sanitizedUrl, { redirect: 'error' });
        if (!res.ok) {
          const error = new Error(`HTTP error: ${res.status}`);
          error.response = res;
          throw error;
        }
        return res;
      },
      { retries: 3, baseDelay: 500, shouldRetry: isRetryableHttpError }
    );
    
    // Size guard — check Content-Length first, then enforce hard cap on actual bytes
    const declaredSize = parseInt(response.headers.get('content-length') ?? '0', 10);
    if (declaredSize > MAX_REMOTE_IMAGE_BYTES) {
      throw AppError.validationError(
        `Remote image exceeds size limit (${MAX_REMOTE_IMAGE_BYTES} bytes).`
      );
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    if (buffer.length > MAX_REMOTE_IMAGE_BYTES) {
      throw AppError.validationError(
        `Remote image exceeds size limit (${MAX_REMOTE_IMAGE_BYTES} bytes).`
      );
    }
    
    return {
      buffer,
      mimetype: response.headers.get('content-type') ?? 'application/octet-stream',
      originalname: path.basename(url.pathname) || 'remote-image',
    };
  }
  
  // ---------- Local path handling ----------
  const resolvedPath = path.isAbsolute(src) ? src : path.resolve(ROOT_DIR, src);
  
  await fsp.access(resolvedPath); // throws if missing — let global handler shape it
  
  return {
    buffer: await fsp.readFile(resolvedPath),
    mimetype: mime.lookup(resolvedPath) || 'application/octet-stream',
    originalname: path.basename(resolvedPath),
  };
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
