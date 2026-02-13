import validator from 'validator';

/**
 * Validates an email address using the `validator` library.
 *
 * Responsibilities:
 * - Performs format validation only
 * - Returns a user-facing error message when invalid
 * - Defers required-field validation to form-level rules
 *
 * Behavior:
 * - Empty values return `undefined` (handled by `required: true` in form config)
 * - Invalid format returns a string error message
 * - Valid email returns `undefined`
 *
 * Usage:
 * - React Hook Form field-level `validate`
 * - CustomForm `FieldConfig.validation`
 *
 * Must NOT:
 * - Enforce required logic
 * - Perform async or server validation
 * - Mutate input values
 *
 * @param value - The email string to validate
 * @returns A validation error message or `undefined` if valid
 */
export const emailValidator = (value: string): string | undefined => {
  if (!value) return undefined; // required handled separately
  
  return validator.isEmail(value)
    ? undefined
    : 'Invalid email address';
};
