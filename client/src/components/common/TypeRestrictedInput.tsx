import type { FC } from 'react';
import BaseInput from '@components/common/BaseInput';
import type { TextFieldProps } from '@mui/material/TextField';

type InputType = 'text' | 'email' | 'tel' | 'number' | 'password';

interface RestrictedInputProps {
  label: string;
  type: InputType;
  placeholder?: string;
  errorText?: string;
}

type TypeRestrictedInputProps = TextFieldProps & RestrictedInputProps;

const TypeRestrictedInput: FC<TypeRestrictedInputProps> = ({
  label,
  type = 'text', // fallback to text
  placeholder,
  errorText,
  slotProps,
  ...props
}) => (
  <BaseInput
    label={label}
    type={type}
    placeholder={placeholder}
    error={!!errorText}
    helperText={errorText}
    slotProps={{
      ...slotProps, // Spread slotProps for further customization
    }}
    {...props} // Spread additional props
  />
);

export default TypeRestrictedInput;
