import type { FC } from 'react';
import { CustomCard, ErrorMessage } from '@components/index';
import LoginForm from '@features/session/components/LoginForm';
import type { LoginRequestBody } from '@features/session';

interface LoginCardProps {
  title?: string;
  subtitle?: string;
  loading: boolean;
  error: string | null;
  
  formValues: LoginRequestBody;
  formErrors: Partial<LoginRequestBody>;
  onFormChange: (field: keyof LoginRequestBody, value: string) => void;
  onFormSubmit: () => void;
}

const LoginCard: FC<LoginCardProps> = ({
                                         title = 'Sign In',
                                         subtitle = 'Sign in to your account.',
                                         loading,
                                         error,
                                         formValues,
                                         formErrors,
                                         onFormChange,
                                         onFormSubmit,
                                       }) => {
  return (
    <CustomCard title={title} subtitle={subtitle}>
      {error && <ErrorMessage message={error} />}
      
      <LoginForm
        loading={loading}
        error={error}
        formValues={formValues}
        formErrors={formErrors}
        onFormChange={onFormChange}
        onFormSubmit={onFormSubmit}
      />
    </CustomCard>
  );
};

export default LoginCard;
