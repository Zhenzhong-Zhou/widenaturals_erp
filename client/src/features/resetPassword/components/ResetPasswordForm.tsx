import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CustomForm, PasswordInput } from '@components/index.ts';
import {
  validatePassword,
  PasswordValidationErrors,
} from '@utils/validation.ts';

interface ResetPasswordFormProps {
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const ResetPasswordForm: FC<ResetPasswordFormProps> = ({ onSubmit }) => {
  const { control, handleSubmit, setError, clearErrors } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleFormSubmit = () =>
    handleSubmit((formData) => {
      // Validate passwords
      const validationErrors = validatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (validationErrors) {
        // Set validation errors in React Hook Form
        Object.entries(validationErrors).forEach(([field, message]) => {
          if (message)
            setError(field as keyof PasswordValidationErrors, { message });
        });
        return;
      }

      // If no errors, proceed with form submission
      onSubmit({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
    })();

  return (
    <CustomForm control={control} onSubmit={handleFormSubmit}>
      {/* Current Password Field */}
      <Controller
        name="currentPassword"
        control={control}
        render={({ field, fieldState }) => (
          <PasswordInput
            label="Current Password"
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              clearErrors('currentPassword');
            }}
            errorText={fieldState.error?.message}
          />
        )}
      />

      {/* New Password Field */}
      <Controller
        name="newPassword"
        control={control}
        render={({ field, fieldState }) => (
          <PasswordInput
            label="New Password"
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              clearErrors('newPassword');
            }}
            helperText="Password must be 8-64 characters long, with at least one uppercase letter, one lowercase letter, one number, and one special character."
            errorText={fieldState.error?.message}
          />
        )}
      />

      {/* Confirm New Password Field */}
      <Controller
        name="confirmPassword"
        control={control}
        render={({ field, fieldState }) => (
          <PasswordInput
            label="Confirm New Password"
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              clearErrors('confirmPassword');
            }}
            errorText={fieldState.error?.message}
          />
        )}
      />
    </CustomForm>
  );
};

export default ResetPasswordForm;
