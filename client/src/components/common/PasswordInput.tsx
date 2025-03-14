import { FC, useState } from 'react';
import { TypeRestrictedInput } from '@components/index.ts';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons/faEyeSlash';
import { TextFieldProps } from '@mui/material/TextField';

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
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={toggleVisibility}
                edge="end"
                aria-label="toggle password visibility"
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
