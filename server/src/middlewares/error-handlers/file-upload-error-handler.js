/**
 * @file file-upload-error-handler.js
 * @description Middleware for handling file upload errors.
 */

const AppError = require('../../utils/app-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle file upload errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const fileUploadErrorHandler = (err, req, res, next) => {
  let errorResponse;
  
  // Handle Multer-specific errors
  if (err.name === 'MulterError') {
    errorResponse = AppError.fileUploadError(err.message || 'An error occurred during file upload.', {
      details: { field: err.field, errorCode: err.code },
    });
  }
  // Handle custom file type validation error
  else if (err.name === 'FileTypeError') {
    errorResponse = AppError.validationError('The uploaded file type is not supported.', {
      type: 'FileTypeError',
      code: 'UNSUPPORTED_FILE_TYPE',
      isExpected: true,
    });
  }
  // Handle custom file size validation error
  else if (err.name === 'FileSizeError') {
    errorResponse = AppError.validationError('The uploaded file exceeds the allowed size.', {
      type: 'FileSizeError',
      code: 'FILE_SIZE_EXCEEDED',
      isExpected: true,
    });
  }
  
  if (errorResponse) {
    // Log the file upload error with metadata
    logError('File Upload Error:', {
      message: errorResponse.message,
      details: errorResponse.details || null,
      route: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip,
    });
    
    // Send structured error response
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }
  
  // Pass to the next error handler if not a file upload error
  next(err);
};

module.exports = fileUploadErrorHandler;
