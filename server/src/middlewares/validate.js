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
    const { error, value } = schema.validate(req[target], validationOptions);
    if (error) {
      return res.status(400).json({
        errors: error.details.map((detail) => ({
          message: detail.message,
          path: detail.path,
        })),
      });
    }
    req[target] = value; // Sanitize and normalize input
    next();
  };
};

module.exports = validate;
