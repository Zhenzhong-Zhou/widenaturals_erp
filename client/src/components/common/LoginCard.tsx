import { FC } from 'react';
import CustomCard from './CustomCard';
import LoginForm from './LoginForm';

const LoginCard: FC = () => {
  const handleSubmit = (data: { email: string; password: string }) => {
    console.log('Login submitted:', data);
    // Add your login logic here (e.g., API call)
  };
  
  return (
    <CustomCard title="Welcome Back" subtitle="Please log in to continue">
      <LoginForm onSubmit={handleSubmit} />
    </CustomCard>
  );
};

export default LoginCard;
