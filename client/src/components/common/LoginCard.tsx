import { FC } from 'react';
import CustomCard from './CustomCard';
import LoginForm from './LoginForm';
import { authService } from '../../services/authenticateService';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';

const LoginCard: FC = () => {
  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      const response = await authService.login(data.email, data.password);
      console.log('Login successful:', response);
      // Navigate to the dashboard or save the token
    } catch (error: unknown) {
      // Handle and log the error
      handleError(error);
      const errorMessage = mapErrorMessage(error);
      console.error('Login failed:', errorMessage);
      // Optionally, show the error message to the user in the UI
      alert(errorMessage); // Replace with a better UI mechanism for displaying errors
    }
  };
  
  return (
    <CustomCard title="Welcome Back" subtitle="Please log in to continue">
      <LoginForm onSubmit={handleSubmit} />
    </CustomCard>
  );
};

export default LoginCard;
