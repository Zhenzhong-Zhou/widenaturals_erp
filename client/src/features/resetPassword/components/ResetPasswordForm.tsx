import type { FC } from 'react';
import {
  validatePassword,
} from '@utils/validation';
import CustomForm from '@components/common/CustomForm';
import type { FieldConfig } from '@components/common/CustomForm';

interface ResetPasswordFormProps {
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const resetPasswordFields: FieldConfig[] = [
  {
    id: 'currentPassword',
    label: 'Current Password',
    type: 'text',
    required: true,
    placeholder: 'Enter your current password',
  },
  {
    id: 'newPassword',
    label: 'New Password',
    type: 'text',
    required: true,
    placeholder: 'Enter your new password',
    defaultHelperText:
      'Password must be 8–64 characters, include upper/lowercase letters, a number, and a special character.',
  },
  {
    id: 'confirmPassword',
    label: 'Confirm New Password',
    type: 'text',
    required: true,
    placeholder: 'Confirm your new password',
  },
];

const ResetPasswordForm: FC<ResetPasswordFormProps> = ({ onSubmit }) => {
  const handleValidatedSubmit = (formData: Record<string, any>) => {
    const { currentPassword, newPassword, confirmPassword } = formData as PasswordFormData;
    
    const validationErrors = validatePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    
    if (validationErrors) {
      // Throw errors that RHF will pick up
      throw validationErrors;
    }
    
    onSubmit({ currentPassword, newPassword, confirmPassword });
  };
  
  return (
    <CustomForm
      fields={resetPasswordFields}
      onSubmit={handleValidatedSubmit}
      submitButtonLabel="Reset Password"
    />
  );
};

export default ResetPasswordForm;
