const AppError = require('../utils/app-error');

/**
 * Middleware to validate request data against a Joi schema.
 *
 * @param {object} schema - Joi validation schema.
 * @param {string} [target='body'] - The target to validate ('body', 'query', 'params').
 * @param {object} [options={}] - Joi validation options.
 * @returns {function} - Middleware function.
 */
const validate = (schema, target = 'body', options = {}) => {
  const defaultOptions = { abortEarly: false, allowUnknown: false };
  const validationOptions = { ...defaultOptions, ...options };
  
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[target], validationOptions);
      if (error) {
        throw new AppError('Validation Error', 400, {
          type: 'ValidationError',
          details: error.details.map((detail) => ({
            message: detail.message,
            path: detail.path,
          })),
        });
      }
      req[target] = value; // Sanitize and normalize input
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
