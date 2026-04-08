import type { FC } from 'react';
import * as PhoneInputLib from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { SxProps, Theme } from '@mui/system';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import { resolveCjsDefault } from '@utils/utils/module/resolveCjsDefault';

/**
 * Safely resolve the PhoneInput component from a CJS module.
 * Handles Vite/ESM interop where the component may be nested under multiple `.default` layers.
 */
const PhoneInput = resolveCjsDefault<any>(PhoneInputLib);

/**
 * Props for CustomPhoneInput component.
 */
interface CustomPhoneInputProps {
  /** Current phone value (recommended: E.164 format, e.g. +16041234567) */
  value: string;
  
  /** Change handler returning normalized phone value */
  onChange: (value: string) => void;
  
  /** Default country (ISO2 code, e.g. 'ca', 'us') */
  country?: string;
  
  /** Disable input interaction */
  disabled?: boolean;
  
  /** MUI sx style overrides */
  sx?: SxProps<Theme>;
  
  /** Whether field is required */
  required?: boolean;
  
  /** Optional label displayed above input */
  label?: string;
}

/**
 * CustomPhoneInput
 *
 * A wrapper around `react-phone-input-2` that:
 * - integrates with MUI styling system
 * - normalizes phone values to E.164 format
 * - provides consistent UI behavior across ERP forms
 *
 * Notes:
 * - Underlying library is not fully controlled; use with caution in complex forms.
 * - For long-term scalability, consider migrating to `react-phone-number-input`.
 *
 * @component
 */
const CustomPhoneInput: FC<CustomPhoneInputProps> = ({
                                                       value,
                                                       onChange,
                                                       country = 'ca',
                                                       disabled = false,
                                                       sx,
                                                       required = true,
                                                       label,
                                                     }) => {
  /**
   * Normalize phone number to E.164 format.
   * Ensures consistent backend storage.
   */
  const handleChange = (phone: string) => {
    const normalized = phone.startsWith('+')
      ? phone
      : `+${phone.replace(/\D/g, '')}`;
    
    onChange(normalized);
  };
  
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
        onChange={handleChange}
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
