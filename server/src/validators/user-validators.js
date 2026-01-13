const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalString,
  validateOptionalUUID,
  validateUUID,
  validateString,
  optionalE164PhoneNumber,
  optionalIsoDate,
} = require('./general-validators');
const { passwordWithPolicy } = require('./auth/password-policy');

/**
 * Joi schema: Validate User ID route parameter.
 *
 * Used for routes like:
 *   GET /api/v1/users/:userId/profile
 *
 * Ensures the provided User ID is a valid UUID (v4).
 *
 * @constant
 * @type {Joi.ObjectSchema}
 *
 * @example
 * // Example usage in middleware
 * const { error } = userIdParamSchema.validate(req.params);
 * if (error) throw AppError.validationError(error.message);
 */
const userIdParamSchema = Joi.object({
  userId: validateUUID('User ID').description('UUID of the user record'),
});

/**
 * Create User – Request Body Schema
 *
 * Transport-layer validation only.
 *
 * Responsibilities:
 * - Validate request shape and primitive constraints
 * - Enforce presence, nullability, and format
 *
 * MUST NOT:
 * - Enforce authorization or ACL rules
 * - Encode role hierarchy or system-role logic
 * - Perform uniqueness or existence checks
 *
 * All business rules are enforced in the service layer.
 */
const createUserSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(255)
      .required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
      }),
    
    password: passwordWithPolicy
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
    
    roleId: validateUUID('Role ID').required(),
    
    firstname: validateString('First Name', 2, 100).required(),
    
    lastname: validateString('Last Name', 2, 100).required(),
    
    phoneNumber: optionalE164PhoneNumber,
    
    jobTitle: validateOptionalString('Job Title', 100),
    
    note: validateOptionalString('Note', 1000),
    
    statusDate: optionalIsoDate(),
  })
  .required()
  .unknown(false);

/**
 * User query schema
 *
 * Validates query parameter shape and types for paginated user
 * list / card endpoints (normalization handled upstream).
 *
 * Includes:
 * - Pagination
 * - Sorting (default: created_at)
 * - Audit date ranges
 * - User-level filters
 * - Keyword fuzzy search (service-layer interpretation)
 *
 * NOTE:
 * - Visibility rules (system/root users) are enforced in business/service layers
 * - This schema validates input shape and types only
 * - No filtering, visibility, or search logic is applied here
 */
const userQuerySchema = paginationSchema
  .concat(createSortSchema('created_at'))
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .keys({
    // -----------------------------------
    // User-level filters
    // -----------------------------------
    statusIds: validateUUIDOrUUIDArrayOptional('User Status IDs'),
    roleIds: validateUUIDOrUUIDArrayOptional('Role IDs'),

    firstname: validateOptionalString('First Name'),
    lastname: validateOptionalString('Last Name'),
    email: validateOptionalString('Email'),
    phoneNumber: validateOptionalString('Phone Number'),
    jobTitle: validateOptionalString('Job Title'),

    // -----------------------------------
    // Audit filters
    // -----------------------------------
    createdBy: validateOptionalUUID('Created By User ID'),
    updatedBy: validateOptionalUUID('Updated By User ID'),

    // -----------------------------------
    // Keyword search
    // -----------------------------------
    keyword: validateOptionalString(
      'Keyword for fuzzy match (name, email, role, status)'
    ),
  });

module.exports = {
  userIdParamSchema,
  userQuerySchema,
  createUserSchema,
};
