import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country?: string; // Default country
  disabled?: boolean;
}

const CustomPhoneInput: React.FC<PhoneInputProps> = ({
                                                       value,
                                                       onChange,
                                                       country = "us", // Default to US format
                                                       disabled = false,
                                                     }) => {
  return (
    <PhoneInput
      country={country}
      value={value}
      onChange={(phone) => onChange(phone)}
      inputProps={{
        required: true,
        autoFocus: false,
        disabled: disabled,
      }}
      specialLabel=""
      inputClass="phone-input"
      containerClass="phone-container"
    />
  );
};

export default CustomPhoneInput;
