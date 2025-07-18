import type { FC } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>; // Optional style override
  required?: boolean;
  label?: string;
}

const CustomPhoneInput: FC<PhoneInputProps> = ({
  value,
  onChange,
  country = 'ca',
  disabled = false,
  sx,
  required = true,
  label,
}) => {
  return (
    <Box
      sx={{
        '& .custom-phone-container': {
          width: '100%',
        },
        '& .custom-phone-input': {
          width: '100%',
          height: '56px',
          paddingLeft: '50px',
          paddingRight: '12px',
          fontSize: '16px',
          borderRadius: 1,
        },
        ...sx,
      }}
    >
      {label && (
        <InputLabel shrink required={required}>
          {label}
        </InputLabel>
      )}
      <PhoneInput
        country={country}
        value={value}
        onChange={(phone) => {
          const cleaned = phone.replace(/\D/g, '');
          const formatted = phone.startsWith('+') ? phone : `+${cleaned}`;
          onChange(formatted);
        }}
        inputProps={{
          name: 'phone',
          required,
          disabled,
          'aria-label': label,
        }}
        enableSearch
        enableAreaCodes
        enableTerritories
        countryCodeEditable
        autoFormat
        specialLabel=""
        inputClass="custom-phone-input"
        containerClass="custom-phone-container"
      />
    </Box>
  );
};

export default CustomPhoneInput;
