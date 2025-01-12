/**
 * @file logger.js
 * @description Configures and exports a reusable logger instance with log rotation and AWS S3 support.
 */

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { loadEnv } = require('../config/env');
const { uploadToS3 } = require('./s3-upload');
const { logError } = require('./logger-helper');
const AppError = require('./AppError');

// Load environment variables
const { env } = loadEnv();
const isDevelopment = env === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const logsDir = path.join(
  __dirname,
  process.env.LOGS_DIR || './server/dev_logs'
);

// Ensure logs directory exists
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  logError('Failed to create logs directory:', err);
  throw AppError.serviceError(
    'Logging setup failed due to directory creation issues.',
    {
      details: {
        directory: logsDir,
        error: err.message,
      },
    }
  );
}

// Custom log levels
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

// Create the logger
const logger = createLogger({
  levels: customLevels.levels,
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console Transport
    new transports.Console({
      format: isDevelopment
        ? format.combine(format.colorize({ all: true }), format.simple())
        : format.json(),
    }),

    // File Transport
    new DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // AWS S3 Transport (Production Only)
    ...(process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET_NAME
      ? [
          new transports.Stream({
            log: (info, callback) => {
              const fileBuffer = Buffer.from(JSON.stringify(info));
              uploadToS3({
                bucketName: process.env.AWS_S3_BUCKET_NAME,
                folder: 'logs',
                fileName: `${new Date().toISOString()}.log`,
                fileBuffer,
                contentType: 'application/json',
              })
                .then(() => callback(null, true))
                .catch((err) => {
                  console.error('Failed to upload log to S3:', err);
                  callback(err || true);
                });
            },
          }),
        ]
      : []),
  ],
});

// Apply colors to custom levels
require('winston').addColors(customLevels.colors);

// Exception and rejection handling
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  })
);
logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  })
);

module.exports = logger;
