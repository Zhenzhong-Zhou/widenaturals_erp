import type { FC } from 'react';
import CustomCard from '@components/common/CustomCard';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import LoginForm from '@features/session/components/LoginForm';
import type { LoginRequestBody } from '@features/session';

interface LoginCardProps {
  title?: string;
  subtitle?: string;
  loading: boolean;
  error: string | null;
  onSubmit: (data: LoginRequestBody) => void;
}

const LoginCard: FC<LoginCardProps> = ({
                                         title = 'Login',
                                         subtitle = 'Sign in to your account.',
                                         loading,
                                         error,
                                         onSubmit,
                                       }) => {
  return (
    <CustomCard title={title} subtitle={subtitle}>
      {error && <ErrorDisplay message={error} />}
      
      <LoginForm
        loading={loading}
        onSubmit={onSubmit}
      />
    </CustomCard>
  );
};

export default LoginCard;
