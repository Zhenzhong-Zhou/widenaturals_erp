import { type FC, type ReactNode, useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { TypeRestrictedInput } from '@components/index';
import type { TextFieldProps } from '@mui/material/TextField';

/**
 * Determines the semantic usage context of a password field.
 *
 * - `login`     → current password (login forms)
 * - `create`    → new password (user creation / reset)
 * - `temporary` → one-time or system-generated passwords
 */
type PasswordIntent =
  | 'login'
  | 'create'
  | 'temporary';

interface PasswordInputProps extends Omit<TextFieldProps, 'type'> {
  /** Field label displayed to the user */
  label: string;
  
  /** Usage intent used to resolve autocomplete behavior */
  intent?: PasswordIntent;
  
  /** Validation error message (error state if present) */
  errorText?: string;
  
  /** Non-error helper or status content */
  helperText?: ReactNode;
}

/**
 * Resolve the appropriate `autocomplete` value based on password intent.
 *
 * This improves UX and prevents browser autofill issues.
 */
const resolvePasswordAutoComplete = (intent?: PasswordIntent) => {
  switch (intent) {
    case 'login':
      return 'current-password';
    case 'create':
      return 'new-password';
    case 'temporary':
    default:
      return 'off';
  }
};

/**
 * PasswordInput
 *
 * Controlled password input with visibility toggle.
 *
 * Responsibilities:
 * - Render a password field with show/hide support
 * - Apply correct autocomplete semantics
 * - Delegate validation rendering to `TypeRestrictedInput`
 *
 * MUST NOT:
 * - Perform validation logic
 * - Manage form state
 * - Enforce password rules
 */
const PasswordInput: FC<PasswordInputProps> = ({
                                                 label,
                                                 intent = 'temporary',
                                                 errorText,
                                                 helperText,
                                                 name,
                                                 ...props
                                               }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const autoComplete = resolvePasswordAutoComplete(intent);
  
  return (
    <TypeRestrictedInput
      label={label}
      type={showPassword ? 'text' : 'password'}
      autoComplete={autoComplete}
      name={name ?? `password-${intent}`} // stable default name
      errorText={errorText}
      helperText={helperText}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                edge="end"
                size="small"
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
};

export default PasswordInput;
