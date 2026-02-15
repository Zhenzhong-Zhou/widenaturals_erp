import { CustomRenderParams, FieldConfig } from '@components/common/CustomForm';
import { validatePasswordStrength } from '@features/auth';
import { FieldStatusHelper, PasswordInput } from '@components/index';

/**
 * Factory function that builds Change Password form fields.
 *
 * This isolates:
 * - Password policy logic
 * - Field-level UI logic
 * - Validation rendering
 *
 * Keeps page component clean and declarative.
 */
export const buildChangePasswordFields = (): FieldConfig[] => [
  {
    id: 'currentPassword',
    label: 'Current Password',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    placeholder: 'Enter your current password',
    customRender: ({
      value,
      onChange,
      required,
      error,
    }: CustomRenderParams) => (
      <PasswordInput
        label="Current Password"
        intent="login"
        value={value ?? ''}
        onChange={onChange}
        required={required}
        fullWidth
        errorText={error?.message}
      />
    ),
  },
  {
    id: 'newPassword',
    label: 'New Password',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    placeholder: 'Enter your new password',
    customRender: ({ value, onChange, required }: CustomRenderParams) => {
      const validationError = value ? validatePasswordStrength(value) : null;

      return (
        <PasswordInput
          label="New Password"
          intent="create"
          value={value ?? ''}
          onChange={onChange}
          required={required}
          fullWidth
          errorText={validationError ?? undefined}
          helperText={
            !value && required ? (
              <FieldStatusHelper status="required" />
            ) : validationError ? (
              <FieldStatusHelper status="invalid" />
            ) : value ? (
              <FieldStatusHelper status="valid" />
            ) : (
              'Password must be 8–64 characters, include upper/lowercase letters, a number, and a special character.'
            )
          }
        />
      );
    },
  },
  {
    id: 'confirmPassword',
    label: 'Confirm New Password',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    placeholder: 'Confirm your new password',
    customRender: ({
      value,
      onChange,
      required,
      formValues,
    }: CustomRenderParams) => {
      const password = formValues?.newPassword;
      const mismatch = value && password && value !== password;

      return (
        <PasswordInput
          label="Confirm New Password"
          intent="create"
          value={value ?? ''}
          onChange={onChange}
          required={required}
          fullWidth
          errorText={mismatch ? 'Passwords do not match' : undefined}
          helperText={
            !value && required ? (
              <FieldStatusHelper status="required" />
            ) : mismatch ? (
              <FieldStatusHelper status="invalid" />
            ) : value ? (
              <FieldStatusHelper status="valid" />
            ) : undefined
          }
        />
      );
    },
  },
];
