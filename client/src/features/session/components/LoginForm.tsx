import { type FC, type FormEvent, useState } from 'react';
import Box from '@mui/material/Box';

import BaseInput from '@components/common/BaseInput';
import PasswordInput from '@components/common/PasswordInput';
import CustomButton from '@components/common/CustomButton';
import type { LoginRequestBody } from '@features/session';

interface LoginFormProps {
  /**
   * Whether the login request is currently in progress.
   * Used to disable inputs and show loading state.
   */
  loading: boolean;
  
  /**
   * Submit handler invoked with validated credentials.
   */
  onSubmit: (data: LoginRequestBody) => void;
}

const LoginForm: FC<LoginFormProps> = ({ loading, onSubmit }) => {
  const [formData, setFormData] = useState<LoginRequestBody>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Partial<LoginRequestBody>>({});
  
  // -----------------------------
  // Validation
  // -----------------------------
  const validate = (): boolean => {
    const newErrors: Partial<LoginRequestBody> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)
    ) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // -----------------------------
  // Handlers
  // -----------------------------
  const handleChange = (
    field: keyof LoginRequestBody,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };
  
  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      <BaseInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={!!errors.email}
        helperText={errors.email}
        fullWidth
        disabled={loading}
      />
      
      <PasswordInput
        label="Password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        errorText={errors.password}
        fullWidth
        disabled={loading}
      />
      
      <CustomButton
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
      >
        {loading ? 'Logging in…' : 'Login'}
      </CustomButton>
    </Box>
  );
};

export default LoginForm;
