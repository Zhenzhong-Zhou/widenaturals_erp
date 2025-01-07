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
  
  if (err.name === 'MulterError') {
    // Multer-specific errors
    errorResponse = new AppError(err.message || 'An error occurred during file upload.', 400, {
      type: 'FileUploadError',
      isExpected: true,
      code: 'MULTER_ERROR',
      details: { field: err.field, errorCode: err.code },
    });
  } else if (err.name === 'FileTypeError') {
    // Custom file type validation error
    errorResponse = new AppError(err.message || 'The uploaded file type is not supported.', 400, {
      type: 'FileTypeError',
      isExpected: true,
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  } else if (err.name === 'FileSizeError') {
    // Custom file size validation error
    errorResponse = new AppError(err.message || 'The uploaded file exceeds the allowed size.', 400, {
      type: 'FileSizeError',
      isExpected: true,
      code: 'FILE_SIZE_EXCEEDED',
    });
  }
  
  if (errorResponse) {
    // Log the file upload error
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
