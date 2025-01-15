const Joi = require('joi');
const AppError = require('../utils/AppError');

// Define Joi schema for login inputs
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long.',
    'any.required': 'Password is required.',
  }),
});

/**
 * Middleware to validate login inputs.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const validateAuthInputs = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    // Collect all error messages
    const validationErrors = error.details.map((detail) => detail.message);
    
    throw AppError.validationError('Validation failed.', {
      code: 'VALIDATION_ERROR',
      details: validationErrors,
    });
  }
  
  next();
};

module.exports = validateAuthInputs;
