import { type FC, type FormEvent, useState } from 'react';
import { useAppSelector } from '@store/storeHooks';
import { selectLoading } from '@features/session/state';
import Box from '@mui/material/Box';
import BaseInput from '@components/common/BaseInput';
import PasswordInput from '@components/common/PasswordInput';
import CustomButton from '@components/common/CustomButton';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

const LoginForm: FC<LoginFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const loading = useAppSelector(selectLoading);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

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
      />
      <PasswordInput
        label="Password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        errorText={errors.password}
        fullWidth
        disabled={loading} // Disable button if loading
      />
      <CustomButton type="submit" variant="contained" color="primary" fullWidth>
        {loading ? 'Logging in...' : 'Login'}
      </CustomButton>
    </Box>
  );
};

export default LoginForm;
