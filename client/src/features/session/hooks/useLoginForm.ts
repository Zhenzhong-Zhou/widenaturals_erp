import { useCallback, useState } from 'react';
import type { LoginRequestBody } from '@features/session';

/**
 * Hook managing login form state and validation.
 *
 * Responsibilities:
 * - Owns local form field state (email, password)
 * - Performs synchronous client-side validation
 * - Exposes stable change and submit handlers
 *
 * Design notes:
 * - This hook is intentionally UI-only and does NOT
 *   interact with Redux, routing, or async state.
 * - Server-side errors are handled externally (e.g. via Redux).
 * - Validation is synchronous and lightweight.
 *
 * Usage:
 * ```ts
 * const {
 *   values,
 *   errors,
 *   handleChange,
 *   handleSubmit,
 * } = useLoginForm(submitLogin);
 * ```
 *
 * @param onSubmit - Callback invoked with validated credentials.
 *                   Typically, dispatches a login thunk.
 *
 * @returns Form state and handlers for controlled login forms.
 */
const useLoginForm = (onSubmit: (data: LoginRequestBody) => void) => {
  /**
   * Controlled form field values.
   */
  const [values, setValues] = useState<LoginRequestBody>({
    email: '',
    password: '',
  });

  /**
   * Field-level validation errors.
   * Keys correspond to LoginRequestBody fields.
   */
  const [errors, setErrors] = useState<Partial<LoginRequestBody>>({});

  /**
   * Validates current form values.
   *
   * Responsibilities:
   * - Ensures required fields are present
   * - Performs basic email format validation
   * - Updates local error state
   *
   * @returns `true` if form is valid, otherwise `false`
   */
  const validate = useCallback(() => {
    const nextErrors: Partial<LoginRequestBody> = {};

    if (!values.email) {
      nextErrors.email = 'Email is required';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(values.email)) {
      nextErrors.email = 'Invalid email format';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [values]);

  /**
   * Updates a single form field.
   *
   * @param field - Field name to update
   * @param value - New field value
   */
  const handleChange = useCallback(
    (field: keyof LoginRequestBody, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /**
   * Submits the form after validation.
   *
   * Behavior:
   * - Runs synchronous validation
   * - Invokes `onSubmit` only when valid
   *
   * Notes:
   * - Async handling (loading, errors) is owned by the caller
   */
  const handleSubmit = useCallback(() => {
    if (validate()) {
      onSubmit(values);
    }
  }, [validate, values, onSubmit]);

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
  };
};

export default useLoginForm;
