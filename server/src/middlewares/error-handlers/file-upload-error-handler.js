/**
 * @file file-upload-error-handler.js
 * @description Middleware for handling file upload errors.
 */

const normalizeError = require('../../utils/normalize-error');
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
    errorResponse = normalizeError(err, {
      type: 'FileUploadError',
      code: 'MULTER_ERROR',
      isExpected: true,
      status: 400,
      message: err.message || 'An error occurred during file upload.',
      details: {
        field: err.field,
        errorCode: err.code,
      },
    });
  }
  
  // Custom file type validation error
  else if (err.name === 'FileTypeError') {
    errorResponse = normalizeError(err, {
      type: 'FileTypeError',
      code: 'UNSUPPORTED_FILE_TYPE',
      isExpected: true,
      status: 400,
      message: 'The uploaded file type is not supported.',
    });
  }
  
  // Custom file size validation error
  else if (err.name === 'FileSizeError') {
    errorResponse = normalizeError(err, {
      type: 'FileSizeError',
      code: 'FILE_SIZE_EXCEEDED',
      isExpected: true,
      status: 400,
      message: 'The uploaded file exceeds the allowed size.',
    });
  }

  if (errorResponse) {
    // Log the file upload error with metadata
    logError(errorResponse, req, {
      context: 'file-upload-handler',
    });
    
    // Send structured error response
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }

  // Pass to the next error handler if not a file upload error
  next(err);
};

module.exports = fileUploadErrorHandler;
