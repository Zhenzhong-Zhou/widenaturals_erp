/**
 * @file logger.js
 * @description Central Winston logger (INFRASTRUCTURE LAYER ONLY).
 *
 * RESPONSIBILITIES:
 * - Log transport (console + rotating files)
 * - Exception / rejection handling
 * - File rotation + compression
 * - Optional S3 upload of archived logs
 *
 * NON-RESPONSIBILITIES:
 * - NO business logic
 * - NO error normalization
 * - NO sanitization (handled in logger-helper)
 *
 * DESIGN:
 * - Accepts structured payloads from upstream
 * - Avoids double serialization
 * - Fail-safe log persistence (never delete on failure)
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { pipeline } = require('stream/promises');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
const logsDir = path.join(__dirname, process.env.LOGS_DIR || '../../dev_logs');
const bucketName = process.env.AWS_S3_BUCKET_NAME;

// ============================================================
// Ensure log directory exists
// ============================================================
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ============================================================
// Custom log levels
// ============================================================
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    fatal: 'red',
    error: 'magenta',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

// ============================================================
// Shared JSON formatter (avoid double stringify)
// ============================================================
const jsonFormatter = format.combine(
  format.timestamp(),
  format.printf((info) => JSON.stringify(info))
);

// ============================================================
// Transports
// ============================================================
const generalLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: jsonFormatter,
});

const exceptionsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'exceptions-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: jsonFormatter,
});

const rejectionsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'rejections-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: jsonFormatter,
});

// ============================================================
// Logger instance
// ============================================================
const logger = createLogger({
  levels: customLevels.levels,
  level: logLevel,
  format: jsonFormatter,
  transports: [
    new transports.Console({
      format: isProduction
        ? jsonFormatter
        : format.combine(format.colorize({ all: true }), format.simple()),
    }),
    generalLogsTransport,
  ],
});

// Attach handlers
logger.exceptions.handle(exceptionsTransport);
logger.rejections.handle(rejectionsTransport);

// Apply colors
require('winston').addColors(customLevels.colors);

// ============================================================
// Compression utility
// ============================================================
const compressFile = async (source, destination) => {
  await pipeline(
    fs.createReadStream(source),
    zlib.createGzip(),
    fs.createWriteStream(destination)
  );
};

// ============================================================
// Rotation + upload handler
// ============================================================
const handleRotationAndUpload = (transport, prefix) => {
  transport.on('rotate', (oldFile) => {
    (async () => {
      try {
        const gzFile = `${oldFile}.gz`;

        await compressFile(oldFile, gzFile);

        if (bucketName) {
          // Lazy require — breaks the circular dependency
          const { uploadFileToS3 } = require('../aws-s3-service');
          const key = `${prefix}/${path.basename(gzFile)}`;

          await uploadFileToS3(gzFile, bucketName, key);

          await fs.promises.unlink(oldFile);
          await fs.promises.unlink(gzFile);
        }
      } catch (err) {
        console.error('[Logger] Rotation failed:', err.message);
      }
    })();
  });
};

// ============================================================
// Enable upload (prod only)
// ============================================================
if (isProduction && bucketName) {
  handleRotationAndUpload(generalLogsTransport, 'logs/general');
  handleRotationAndUpload(exceptionsTransport, 'logs/exceptions');
  handleRotationAndUpload(rejectionsTransport, 'logs/rejections');
}

module.exports = logger;
