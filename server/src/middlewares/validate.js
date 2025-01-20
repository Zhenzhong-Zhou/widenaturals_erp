const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { sanitizeValidationError } = require('../utils/sensitive-data-utils');

/**
 * Middleware to validate request data against a Joi schema.
 *
 * @param {object} schema - Joi validation schema.
 * @param {string} [target='body'] - The target to validate ('body', 'query', 'params').
 * @param {object} [options={}] - Joi validation options.
 * @param {string} [errorMessage='Validation failed.'] - Custom error message.
 * @returns {function} - Middleware function.
 */
const validate = (
  schema,
  target = 'body',
  options = {},
  errorMessage = 'Validation failed.'
) => {
  // Default Joi validation options
  const defaultOptions = { abortEarly: false, allowUnknown: false };
  const validationOptions = { ...defaultOptions, ...options };

  return (req, res, next) => {
    try {
      // Validate the target
      if (!['body', 'query', 'params'].includes(target)) {
        throw new AppError(`Invalid validation target: ${target}`, 500, {
          type: 'InternalError',
          isExpected: false,
        });
      }

      const { error, value } = schema.validate(req[target], validationOptions);

      if (error) {
        // Sanitize the error details
        const sanitizedDetails = sanitizeValidationError(error);

        // Log the sanitized error in non-production environments
        if (process.env.NODE_ENV !== 'production') {
          logError('Validation Error:', {
            method: req.method,
            route: req.originalUrl,
            target,
            details: sanitizedDetails,
          });
        }

        // Throw sanitized validation error
        throw AppError.validationError(errorMessage, {
          details: sanitizedDetails,
        });
      }

      req[target] = value; // Sanitize and normalize input
      next();
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  };
};

module.exports = validate;
