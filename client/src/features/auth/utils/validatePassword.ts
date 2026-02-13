import { PASSWORD_POLICY } from '@features/auth';

/**
 * Validates password strength for client-side UX.
 *
 * @param password - Raw password input
 * @returns Error message if invalid, otherwise `null`
 */
export const validatePasswordStrength = (
  password: unknown
): string | null => {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  
  if (!PASSWORD_POLICY.REGEX.test(password)) {
    return PASSWORD_POLICY.ERROR_MESSAGE;
  }
  
  return null;
};
