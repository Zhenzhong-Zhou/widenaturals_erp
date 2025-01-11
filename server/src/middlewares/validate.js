const AppError = require('../utils/app-error');
const { logError } = require('../utils/logger-helper');

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
        const errorDetails = error.details.map((detail) => ({
          message: detail.message,
          path: detail.path.join('.'), // Flatten the path for better readability
          type: detail.type, // Include the Joi validation error type
          context: detail.context, // Include additional context
        }));

        // Log the validation error in non-production environments
        if (process.env.NODE_ENV !== 'production') {
          logError('Validation Error:', {
            method: req.method,
            route: req.originalUrl,
            target,
            details: errorDetails,
          });
        }

        // Throw structured validation error
        throw AppError.validationError(errorMessage, {
          details: errorDetails,
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
