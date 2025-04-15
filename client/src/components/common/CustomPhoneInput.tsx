import type { FC } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';

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
                                                 label = 'Phone number',
                                               }) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
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
