import { FC } from 'react';
import CustomCard from './CustomCard';
import LoginForm from './LoginForm';
import axiosInstance from '@utils/axiosConfig.ts';

const LoginCard: FC = () => {
  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      const response = await axiosInstance.post('/auth/login', data); // axios.post now works
      console.log('Login successful:', response.data);
      // Save the token or navigate to the dashboard
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      // Show error message to the user
    }
  };
  
  return (
    <CustomCard title="Welcome Back" subtitle="Please log in to continue">
      <LoginForm onSubmit={handleSubmit} />
    </CustomCard>
  );
};

export default LoginCard;
