import { FC, useState } from 'react';
import TypeRestrictedInput from './TypeRestrictedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { TextFieldProps } from '@mui/material/TextField';

interface PasswordInputProps extends Omit<TextFieldProps, 'type'> {
  label: string;
  errorText?: string;
}

const PasswordInput: FC<PasswordInputProps> = ({ label, errorText, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Toggle password visibility
  const toggleVisibility = () => setShowPassword((prev) => !prev);
  
  return (
    <TypeRestrictedInput
      label={label}
      type={showPassword ? 'text' : 'password'} // Toggle type dynamically
      errorText={errorText} // Display error message
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
