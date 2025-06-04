/**
 * @file logger.js
 * @description Configures and exports a reusable logger instance with log rotation and efficient AWS S3 support.
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { loadEnv } = require('../config/env');
const {
  logSystemInfo,
  logSystemException
} = require('./system-logger');
const AppError = require('./AppError');
const { uploadFileToS3 } = require('./aws-s3-service');

// Load environment variables
loadEnv();
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
const logsDir = path.join(__dirname, process.env.LOGS_DIR || '../../dev_logs');
const bucketName = process.env.AWS_S3_BUCKET_NAME;

// Ensure logs directory exists
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logSystemInfo('Log directory created', {
      context: 'logger-init',
      directory: logsDir,
    });
  }
} catch (err) {
  logSystemException(err, 'Failed to create logs directory', {
    context: 'logger-init',
    directory: logsDir,
  });
  throw AppError.serviceError('Logging setup failed', {
    details: { error: err.message },
  });
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

// General Logs Transport
const generalLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d',
});

// Exception Logs Transport
const exceptionsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'exceptions-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d',
});

// Rejection Logs Transport
const rejectionsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'rejections-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d',
});

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
      format: isProduction
        ? format.json()
        : format.combine(format.colorize({ all: true }), format.simple()),
    }),
    generalLogsTransport,
  ],
});

// Attach exception and rejection handlers to the logger
logger.exceptions.handle(exceptionsTransport);
logger.rejections.handle(rejectionsTransport);

// Apply colors to custom levels
require('winston').addColors(customLevels.colors);

// Compression handler
const compressFile = (sourceFile, destinationFile) =>
  new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sourceFile);
    const writeStream = fs.createWriteStream(destinationFile);
    const gzip = zlib.createGzip();
    
    readStream
      .pipe(gzip)
      .pipe(writeStream)
      .on('finish', () => {
        logSystemInfo('Compression successful', {
          context: 'log-rotation',
          sourceFile,
          destinationFile,
        });
        resolve();
      })
      .on('error', (err) => {
        logSystemException(err, 'Compression failed', {
          context: 'log-rotation',
          file: sourceFile,
        });
        reject(err);
      });
  });

// Rotation + S3 upload
const handleRotationAndUpload = (transport, s3PathPrefix) => {
  transport.on('rotate', async (oldFilename, newFilename) => {
    logSystemInfo('Log rotation triggered', {
      context: 'log-rotation',
      oldFilename,
      newFilename,
    });
    
    try {
      // Compress file before uploading
      const compressedFilename = `${oldFilename}.gz`;
      await compressFile(oldFilename, compressedFilename);
      
      // Prepare S3 key (path)
      const s3Key = `${s3PathPrefix}/${path.basename(compressedFilename)}`;

      // Upload a compressed file to S3
      await uploadFileToS3(compressedFilename, bucketName, s3Key);
      
      // Cleanup - Remove the original & compressed file
      fs.unlinkSync(oldFilename);
      fs.unlinkSync(compressedFilename);
      
      logSystemInfo('Log uploaded and cleaned up', {
        context: 'log-rotation',
        s3Key,
        compressedFilename,
      });
    } catch (error) {
      logSystemException(error, 'Failed to upload log to S3', {
        context: 'log-rotation',
        oldFilename,
      });
    }
  });
};

// Log Rotation Handler - Only in Production
if (isProduction && bucketName) {
  handleRotationAndUpload(generalLogsTransport, 'logs/general');
  handleRotationAndUpload(exceptionsTransport, 'logs/exceptions');
  handleRotationAndUpload(rejectionsTransport, 'logs/rejections');
} else {
  setImmediate(() => {
    logSystemInfo('Log rotation is local only. S3 upload is disabled.', {
      context: 'logger-init',
      environment: process.env.NODE_ENV,
    });
  });
}

module.exports = logger;
