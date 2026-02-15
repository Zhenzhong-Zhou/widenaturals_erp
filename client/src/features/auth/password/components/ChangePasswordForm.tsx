import { type FC, useMemo } from 'react';
import { CustomForm } from '@components/index';
import { buildChangePasswordFields } from '@features/auth/password/components';

/**
 * Data contract emitted by ChangePasswordForm upon successful validation.
 */
export interface PasswordUpdateSubmitData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordUpdateFormProps {
  /**
   * Invoked only after client-side validation succeeds.
   * Server-side validation must still be enforced separately.
   */
  onSubmit: (data: PasswordUpdateSubmitData) => void;

  /** Optional override for submit button label */
  submitButtonLabel?: string;

  /** Loading state (typically tied to API mutation state) */
  loading?: boolean;

  /** Disables entire form interaction */
  disabled?: boolean;
}

/**
 * ChangePasswordForm
 *
 * Stateless form wrapper responsible for:
 * - Rendering password update fields
 * - Performing client-side validation
 * - Emitting sanitized data upward
 *
 * Does NOT:
 * - Handle API calls
 * - Manage auth/session state
 * - Perform server validation
 */
const ChangePasswordForm: FC<PasswordUpdateFormProps> = ({
  onSubmit,
  submitButtonLabel = 'Update Password',
  loading,
  disabled,
}) => {
  /**
   * Memoized field configuration to prevent unnecessary re-renders.
   */
  const fields = useMemo(() => buildChangePasswordFields(), []);

  /**
   * Normalizes form data and performs client-side password validation
   * before delegating submission upward.
   */
  const handleValidatedSubmit = (formData: Record<string, unknown>) => {
    const currentPassword = String(formData.currentPassword ?? '');
    const newPassword = String(formData.newPassword ?? '');
    const confirmPassword = String(formData.confirmPassword ?? '');

    onSubmit({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <CustomForm
      fields={fields}
      onSubmit={handleValidatedSubmit}
      submitButtonLabel={loading ? 'Updating password...' : submitButtonLabel}
      disabled={disabled}
    />
  );
};

export default ChangePasswordForm;
