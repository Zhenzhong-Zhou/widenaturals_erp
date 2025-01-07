/**
 * Middleware to handle file upload errors.
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const fileUploadErrorHandler = (err, req, res, next) => {
  if (err.name === 'MulterError') {
    // Multer-specific errors
    return res.status(400).json({
      error: 'File Upload Error',
      message: err.message || 'An error occurred during file upload.',
    });
  }
  
  if (err.name === 'FileTypeError') {
    // Custom file type validation error
    return res.status(400).json({
      error: 'Unsupported File Type',
      message: err.message || 'The uploaded file type is not supported.',
    });
  }
  
  if (err.name === 'FileSizeError') {
    // Custom file size validation error
    return res.status(400).json({
      error: 'File Size Exceeded',
      message: err.message || 'The uploaded file exceeds the allowed size.',
    });
  }
  
  next(err); // Pass to the next error handler if not a file upload error
};

module.exports = fileUploadErrorHandler;
