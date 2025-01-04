/**
 * @file logger.js
 * @description Configures and exports a reusable logger instance with log rotation and AWS S3 support.
 */

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { uploadToS3 } = require('./s3Uploader');

// Environment variables
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const logsDir = process.env.LOGS_DIR || './logs'; // Default to `./logs`

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a reusable file transport
const createFileTransport = () =>
  new DailyRotateFile({
    filename: path.join(logsDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  });

// Create a reusable AWS S3 transport
class S3Transport extends transports.Stream {
  constructor(opts) {
    super(opts);
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.folder = opts.folder || 'logs';
  }
  
  log(info, callback) {
    const fileBuffer = Buffer.from(JSON.stringify(info));
    uploadToS3({
      bucketName: this.bucketName,
      folder: this.folder,
      fileName: `${new Date().toISOString()}.log`,
      fileBuffer,
      contentType: 'application/json',
    })
      .then(() => callback(null, true))
      .catch((err) => {
        console.error('Failed to upload log to S3:', err);
        callback(err || true);
      });
  }
}

// Create the logger
const logger = createLogger({
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
        ? format.combine(format.colorize(), format.simple())
        : format.json(),
    }),
    
    // File Transport
    createFileTransport(),
    
    // AWS S3 Transport (Production Only)
    ...(process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET_NAME
      ? [new S3Transport({ folder: 'logs' })]
      : []),
  ],
});

// Handle uncaught exceptions and unhandled rejections
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
