import type { FC, ReactNode } from 'react';
import { BaseInput } from '@components/index';
import type { TextFieldProps } from '@mui/material/TextField';

/**
 * Allowed input types enforced by TypeRestrictedInput.
 *
 * This prevents accidental usage of unsupported or unsafe input types.
 */
type InputType = 'text' | 'email' | 'tel' | 'number' | 'password';

interface RestrictedInputProps {
  /** Input label displayed to the user */
  label: string;

  /** Allowed input types */
  type: InputType;

  /** Optional placeholder text */
  placeholder?: string;

  /**
   * Validation error message.
   *
   * Presence of this value:
   * - Enables error state
   * - Takes precedence over helperText
   */
  errorText?: string;

  /**
   * Non-error helper or status content.
   *
   * Used for:
   * - Required indicators
   * - Valid / invalid status hints
   * - Informational guidance
   *
   * Ignored when errorText is present.
   */
  helperText?: ReactNode;
}

/**
 * Props for TypeRestrictedInput.
 *
 * We intentionally omit `type` from TextFieldProps to enforce
 * a constrained set of allowed input types.
 */
type TypeRestrictedInputProps = Omit<TextFieldProps, 'type'> &
  RestrictedInputProps;

/**
 * TypeRestrictedInput
 *
 * Thin adapter over BaseInput that enforces:
 * - A restricted set of allowed input types
 * - A strict separation between error messages and helper/status UI
 *
 * Design contract:
 * - `errorText` represents validation failures
 * - `helperText` represents non-error status or guidance
 * - Error text always takes precedence over helper text
 *
 * IMPORTANT:
 * This component does NOT perform validation.
 * It only renders state derived from upstream logic.
 */
const TypeRestrictedInput: FC<TypeRestrictedInputProps> = ({
  label,
  type = 'text',
  placeholder,
  errorText,
  helperText,
  slotProps,
  ...props
}) => {
  const resolvedHelperText = errorText ?? helperText;

  return (
    <BaseInput
      label={label}
      type={type}
      placeholder={placeholder}
      error={Boolean(errorText)}
      helperText={resolvedHelperText}
      slotProps={{
        ...slotProps,
      }}
      {...props}
    />
  );
};

export default TypeRestrictedInput;
