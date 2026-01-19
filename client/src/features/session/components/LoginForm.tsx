import type { FC, FormEvent } from 'react';
import Box from '@mui/material/Box';
import BaseInput from '@components/common/BaseInput';
import PasswordInput from '@components/common/PasswordInput';
import CustomButton from '@components/common/CustomButton';
import type { LoginRequestBody } from '@features/session';

interface LoginFormProps {
  loading: boolean;
  formValues: LoginRequestBody;
  formErrors: Partial<LoginRequestBody>;
  onFormChange: (field: keyof LoginRequestBody, value: string) => void;
  onFormSubmit: () => void;
}

/**
 * Login form for user authentication.
 *
 * Intentionally kept lightweight and independent of
 * generic form abstractions due to security and UX needs.
 */
const LoginForm: FC<LoginFormProps> = ({
                                         loading,
                                         formValues,
                                         formErrors,
                                         onFormChange,
                                         onFormSubmit,
                                       }) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onFormSubmit();
  };
  
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.75,
      }}
    >
      <BaseInput
        label="Email"
        type="email"
        value={formValues.email}
        onChange={(e) => onFormChange('email', e.target.value)}
        error={!!formErrors.email}
        helperText={formErrors.email}
        disabled={loading}
        fullWidth
      />
      
      <PasswordInput
        label="Password"
        intent="login"
        value={formValues.password}
        onChange={(e) => onFormChange('password', e.target.value)}
        errorText={formErrors.password}
        disabled={loading}
        fullWidth
      />
      
      <CustomButton
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ minHeight: 44 }}
      >
        {loading ? 'Logging in…' : 'Login'}
      </CustomButton>
    </Box>
  );
};

export default LoginForm;
