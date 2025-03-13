import { FC } from 'react';
import PhoneInput from 'react-phone-input-2';
import "react-phone-input-2/lib/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country?: string; // Default country
  disabled?: boolean;
}

const CustomPhoneInput: FC<PhoneInputProps> = ({
                                                       value,
                                                       onChange,
                                                       country = "ca", // Default to US format
                                                       disabled = false,
                                                     }) => {
  return (
    <PhoneInput
      country={country}
      value={value}
      onChange={(phone) => {
        // Ensure E.164 format before sending to backend
        const formattedNumber = phone.startsWith("+")
          ? phone
          : `+${phone.replace(/[^0-9]/g, "")}`;
        onChange(formattedNumber);
      }}
      inputProps={{
        required: true,
        autoFocus: false,
        disabled: disabled,
      }}
      enableSearch={true}
      enableAreaCodes={true}
      enableTerritories={true}
      countryCodeEditable={true}
      autoFormat={true}
      specialLabel=""
      inputClass="phone-input"
      containerClass="phone-container"
    />
  );
};

export default CustomPhoneInput;
