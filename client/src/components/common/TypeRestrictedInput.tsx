import { FC } from 'react';
import BaseInput from './BaseInput';
import { TextFieldProps } from '@mui/material/TextField';

type InputType = 'text' | 'email' | 'tel' | 'number' | 'password';

interface CustomFields {
  label: string;
  type: InputType;
  placeholder?: string;
  errorText?: string;
}

type TypeRestrictedInputProps = TextFieldProps & CustomFields;

const TypeRestrictedInput: FC<TypeRestrictedInputProps> = ({
  label,
  type,
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
