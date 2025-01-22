import { FC, useState } from 'react';
import { Form, PasswordInput } from '@components/index.ts';

interface ResetPasswordFormProps {
  onSubmit: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
}

const ResetPasswordForm: FC<ResetPasswordFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleFormSubmit = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    
    setError(null);
    onSubmit({ currentPassword, newPassword, confirmPassword });
  };
  
  return (
    <Form onSubmit={handleFormSubmit}>
      <PasswordInput
        label="Current Password"
        value={formData.currentPassword}
        onChange={(e) => handleChange('currentPassword', e.target.value)}
        errorText={error && !formData.currentPassword ? error : ''}
      />
      <PasswordInput
        label="New Password"
        value={formData.newPassword}
        onChange={(e) => handleChange('newPassword', e.target.value)}
        errorText={error && formData.newPassword ? error : ''}
        helperText={
          !error
            ? 'Password must include at least one uppercase letter, one lowercase letter, one number, and at least two special characters. Minimum length: 8.'
            : ''
        }
      />
      <PasswordInput
        label="Confirm New Password"
        value={formData.confirmPassword}
        onChange={(e) => handleChange('confirmPassword', e.target.value)}
        errorText={
          error && formData.newPassword !== formData.confirmPassword
            ? 'Passwords do not match.'
            : ''
        }
      />
    </Form>
  );
};

export default ResetPasswordForm;
