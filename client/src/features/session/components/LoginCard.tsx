import type { FC } from 'react';
import { CustomCard, ErrorMessage } from '@components/index';
import { LoginForm } from '@features/session/components';
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

/**
 * Authentication card wrapper for the login flow.
 *
 * Responsibilities:
 * - Presents login context (title and subtitle)
 * - Displays authentication-level errors (e.g. invalid credentials)
 * - Delegates input handling to LoginForm
 *
 * Design note:
 * - Auth errors are intentionally handled here rather than
 *   inside LoginForm to keep form components stateless
 *   and reusable.
 */
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
        formValues={formValues}
        formErrors={formErrors}
        onFormChange={onFormChange}
        onFormSubmit={onFormSubmit}
      />
    </CustomCard>
  );
};

export default LoginCard;
