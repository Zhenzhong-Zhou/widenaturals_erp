import validator from 'validator';

export interface PasswordValidationInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordValidationErrors {
  currentPassword: string | null;
  newPassword: string | null;
  confirmPassword: string | null;
}

export const validatePassword = ({
  currentPassword,
  newPassword,
  confirmPassword,
}: PasswordValidationInput): PasswordValidationErrors | null => {
  const errors: PasswordValidationErrors = {
    currentPassword: null,
    newPassword: null,
    confirmPassword: null,
  };

  // Current password validation
  if (!currentPassword) {
    errors.currentPassword = 'Current password cannot be empty.';
  }

  // New password validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-])[A-Za-z\d@$!%*?&\-]{8,64}$/;
  if (!newPassword) {
    errors.newPassword = 'New password cannot be empty.';
  } else if (newPassword === currentPassword) {
    errors.newPassword =
      'New password cannot be the same as the current password.';
  } else if (!passwordRegex.test(newPassword)) {
    errors.newPassword =
      'New password must be 8-64 characters long, with at least one uppercase letter, one lowercase letter, one number, and one special character.';
  } else if (/(.)\1{2}/.test(newPassword)) {
    errors.newPassword =
      'New password cannot contain more than two consecutive repeating characters.';
  }

  // Confirm password validation
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'New password and confirm password do not match.';
  }

  // Remove fields with `null` values and check if any errors exist
  const hasErrors = Object.values(errors).some((error) => error !== null);

  return hasErrors ? errors : null;
};

export const emailValidator = (value: string): string | undefined => {
  if (!value) return undefined; // let `required: true` handle empty
  return validator.isEmail(value) ? undefined : 'Invalid email address';
};
