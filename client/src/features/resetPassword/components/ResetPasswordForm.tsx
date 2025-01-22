import { FC, useState } from 'react';
import { Form, PasswordInput } from '@components/index.ts';
import { Box } from '@mui/material';
import { validatePassword, PasswordValidationErrors } from '@utils/validation.ts';

interface ResetPasswordFormProps {
  onSubmit: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
}

const ResetPasswordForm: FC<ResetPasswordFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<PasswordValidationErrors>({
    currentPassword: null,
    newPassword: null,
    confirmPassword: null,
  });
  
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: null })); // Clear field-specific error on change
  };
  
  const handleFormSubmit = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    
    // Validate passwords
    const validationErrors = validatePassword({ currentPassword, newPassword, confirmPassword });
    if (validationErrors) {
      setValidationErrors(validationErrors); // Set validation errors in state
      return;
    }
    
    // If no errors, proceed with form submission
    onSubmit({ currentPassword, newPassword, confirmPassword });
  };
  
  return (
    <Form onSubmit={() => {
      handleFormSubmit()
    }}>
      <PasswordInput
        label="Current Password"
        value={formData.currentPassword}
        onChange={(e) => handleChange('currentPassword', e.target.value)}
        errorText={validationErrors.currentPassword || ''}
      />
      {validationErrors.currentPassword ?
        <Box style={{ color: 'red', marginTop: '5px' }}>
          {validationErrors.currentPassword}
        </Box>
        :
        ''
      }
      <PasswordInput
        label="New Password"
        value={formData.newPassword}
        onChange={(e) => handleChange('newPassword', e.target.value)}
        errorText={validationErrors.newPassword || ''}
        helperText={
          'Password must be 8-64 characters long, with at least one uppercase letter, one lowercase letter, one number, and one special character.'
        }
      />
      {validationErrors.newPassword ?
        <Box style={{ color: 'red', marginTop: '5px' }}>
          {validationErrors.newPassword}
        </Box>
        :
        ''
      }
      <PasswordInput
        label="Confirm New Password"
        value={formData.confirmPassword}
        onChange={(e) => handleChange('confirmPassword', e.target.value)}
        errorText={validationErrors.confirmPassword || ''}
      />
      {validationErrors.confirmPassword ?
        <Box style={{ color: 'red', marginTop: '5px' }}>
          {validationErrors.confirmPassword}
        </Box>
        :
        ''
      }
    </Form>
  );
};

export default ResetPasswordForm;
