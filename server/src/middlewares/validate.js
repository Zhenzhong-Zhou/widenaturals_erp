const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { sanitizeValidationError } = require('../utils/sensitive-data-utils');

/**
 * Middleware to validate request data using Joi schema.
 *
 * @param {object} schema - Joi validation schema.
 * @param {string} [target='body'] - The target to validate ('body', 'query', 'params').
 * @param {object} [options={}] - Joi validation options.
 * @param {string} [errorMessage='Validation failed.'] - Custom error message.
 * @returns {function} - Express middleware function.
 */
const validate = (
  schema,
  target = 'body',
  options = {},
  errorMessage = 'Validation failed.'
) => {
  if (!schema || typeof schema.validate !== 'function') {
    throw AppError.validationError('Invalid Joi schema provided.');
  }

  if (!['body', 'query', 'params'].includes(target)) {
    throw AppError.validationError(`Invalid validation target: ${target}`);
  }

  const defaultOptions = { abortEarly: false, allowUnknown: false };
  const validationOptions = { ...defaultOptions, ...options };

  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[target], validationOptions);

      if (error) {
        // Sanitize the Joi validation details
        const sanitizedDetails =
          typeof sanitizeValidationError === 'function'
            ? sanitizeValidationError(error)
            : error.details.map(({ message, path }) => ({
                message,
                path: path.join('.'),
              }));
        
        const appError = AppError.validationError(errorMessage, {
          details: sanitizedDetails,
        });
        
        // Log only in non-prod for developer visibility
        if (process.env.NODE_ENV !== 'production') {
          logError(appError, req, {
            context: 'validation-middleware',
            stage: 'joi-schema-validation',
            target,
          });
        }
        
        throw appError;
      }
      
      req[target] = value; // Replace it with validated input
      next();
    } catch (err) {
      next(err); // Forward error to global error handler
    }
  };
};

module.exports = validate;
