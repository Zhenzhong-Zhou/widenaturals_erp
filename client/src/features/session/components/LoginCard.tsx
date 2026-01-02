import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomCard from '@components/common/CustomCard';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import LoginForm from '@features/session/components/LoginForm';
import { AppError, handleError } from '@utils/error';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { useLoading } from '@context/LoadingContext';
import { loginThunk, selectLoginError } from '@features/session/state';
import { setMessage } from '@features/session/state/sessionSlice';

interface LoginCardProps {
  title?: string; // Optional title
  subtitle?: string; // Optional subtitle
}

const LoginCard: FC<LoginCardProps> = ({
  title = 'Login',
  subtitle = 'Sign in to your account.',
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading(); // Use correct functions from the context
  const loginError = useAppSelector(selectLoginError);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      showLoading('Logging in...', 'spinner');

      await dispatch(loginThunk(data)).unwrap();

      navigate('/dashboard');
    } catch (error: unknown) {
      handleError(error);

      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Login failed. Please try again.';

      console.error('Login failed:', message);
      dispatch(setMessage(message));
    } finally {
      hideLoading();
    }
  };

  return (
    <CustomCard title={title} subtitle={subtitle}>
      {loginError && <ErrorDisplay message={loginError} />}{' '}
      {/* Show login errors */}
      <LoginForm onSubmit={handleSubmit} />
    </CustomCard>
  );
};

export default LoginCard;
