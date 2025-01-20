import { FC } from 'react';
import CustomCard from '@components/common/CustomCard.tsx';
import LoginForm from './LoginForm.tsx';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';
import { loginThunk } from '../state/sessionThunks.ts';
import { useAppDispatch, useAppSelector } from '../../../store/storeHooks.ts';
import { selectLoginError } from '../state/sessionSelectors.ts';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../../../context/LoadingContext.tsx';
import { ErrorDisplay } from '@components/index.ts';

interface LoginCardProps {
  title?: string; // Optional title
  subtitle?: string; // Optional subtitle
}

const LoginCard: FC<LoginCardProps> = ({ title = 'Login', subtitle = 'Sign in to your account.' }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading(); // Use correct functions from the context
  const loginError = useAppSelector(selectLoginError);
  
  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      showLoading('Logging in...', 'spinner'); // Show loading spinner with a message
      await dispatch(loginThunk(data)).unwrap();
      console.log('Login successful');
      navigate('/dashboard');
    } catch (error: unknown) {
      // Handle and log the error
      handleError(error);
      const errorMessage = mapErrorMessage(error);
      console.error('Login failed:', errorMessage);
    } finally {
      hideLoading(); // Always hide loading spinner
    }
  };
  
  return (
    <CustomCard title={title} subtitle={subtitle}>
      {loginError && <ErrorDisplay message={loginError} />} {/* Show login errors */}
      <LoginForm onSubmit={handleSubmit} />
    </CustomCard>
  );
};

export default LoginCard;
