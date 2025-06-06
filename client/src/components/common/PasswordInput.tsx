import { type FC, useState } from 'react';
import TypeRestrictedInput from '@components/common/TypeRestrictedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import type { TextFieldProps } from '@mui/material/TextField';

interface PasswordInputProps extends Omit<TextFieldProps, 'type'> {
  label: string;
  errorText?: string;
  helperText?: string; // Add helperText as an optional prop
}

const PasswordInput: FC<PasswordInputProps> = ({
  label,
  errorText,
  helperText,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Toggle password visibility
  const toggleVisibility = () => setShowPassword((prev) => !prev);

  return (
    <TypeRestrictedInput
      label={label}
      type={showPassword ? 'text' : 'password'} // Toggle type dynamically
      errorText={errorText || ''} // Only show errorText when it exists
      helperText={errorText ? '' : helperText} // Show helperText only if no error
      error={!!errorText}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={toggleVisibility}
                edge="end"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                size="small"
                sx={{ minWidth: 40 }}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...props} // Spread additional props
    />
  );
};

export default PasswordInput;
