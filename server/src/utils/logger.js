/**
 * @file logger.js
 * @description Configures and exports a reusable logger instance with log rotation and AWS S3 support.
 */

const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { uploadToS3 } = require('./s3Uploader');

// Environment variables
const isDevelopment = process.env.NODE_ENV === 'development';
const logsDir = process.env.LOGS_DIR; // Local logs directory

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Reusable transport configurations
const getFileTransport = () =>
  new DailyRotateFile({
    filename: `${logsDir}/app-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  });

const getS3Transport = () => ({
  log(info, callback) {
    const fileBuffer = Buffer.from(JSON.stringify(info));
    uploadToS3({
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      folder: 'logs',
      fileName: `${new Date().toISOString()}.log`,
      fileBuffer,
      contentType: 'application/json',
    })
      .then(() => callback(null, true))
      .catch((err) => callback(err || true));
  },
});

// Create logger instance
const logger = createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Include stack traces for errors
    format.json() // Structured JSON logs
  ),
  transports: [
    // Console Transport (Development Only)
    new transports.Console({
      format: isDevelopment
        ? format.combine(format.colorize(), format.simple())
        : format.json(),
    }),
    
    // File Transport with Daily Rotation
    getFileTransport(),
    
    // AWS S3 Transport (Production Only)
    ...(process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET_NAME
      ? [getS3Transport()]
      : []),
  ],
});

// Log uncaught exceptions and unhandled rejections
if (!isDevelopment) {
  logger.exceptions.handle(
    new transports.File({ filename: `${logsDir}/exceptions.log` })
  );
  logger.rejections.handle(
    new transports.File({ filename: `${logsDir}/rejections.log` })
  );
}

module.exports = logger;
