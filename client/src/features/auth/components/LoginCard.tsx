import { FC } from 'react';
import CustomCard from '@components/common/CustomCard.tsx';
import LoginForm from './LoginForm.tsx';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts';
import { loginThunk } from '../state/authThunks.ts';
import { useAppDispatch } from '../../../store/storeHooks.ts';

const LoginCard: FC = () => {
  const dispatch = useAppDispatch();
  
  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      // const response = await authService.login(data.email, data.password);
      await dispatch(loginThunk(data)).unwrap(); // Dispatch the thunk and unwrap the promise
      console.log('Login successful');
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
