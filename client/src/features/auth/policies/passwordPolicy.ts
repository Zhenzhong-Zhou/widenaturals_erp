/**
 * Central password security policy (frontend).
 *
 * This file mirrors backend password rules to provide
 * early UX validation and consistent error messaging.
 *
 * IMPORTANT:
 * - Backend remains the source of truth
 * - Frontend validation is advisory only
 */
export const PASSWORD_POLICY = {
  REGEX:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=(?:.*[!@#$%^&*\-]){2,})(?=.{8,64})(?!.*(.)\1{2}).*$/,
  
  ERROR_MESSAGE:
    'Password must include at least one uppercase letter, one lowercase letter,' +
    ' one number, and at least two special characters. ' +
    'It must be 8–64 characters long and must not contain more than ' +
    'two consecutive repeating characters.',
} as const;
