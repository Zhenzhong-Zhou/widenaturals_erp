import { type FC, type ReactNode, useMemo } from 'react';
import Dropdown, { type OptionType } from '@components/common/Dropdown';
import { getCountryCodeItems } from '@utils/constants/skuConstants.ts';

interface CountryRegionCodeDropdownProps {
  /** Selected code (ISO country code or region code) */
  value: string | null;

  /** Called when user selects a new code */
  onChange: (value: string) => void;

  /** Optional label displayed above the field */
  label?: string;

  /** Disable input */
  disabled?: boolean;

  /** Optional placeholder */
  placeholder?: string;

  /** Optional helper text (validation errors, hints, etc.) */
  helperText?: ReactNode;
}

/**
 * Dropdown for selecting a country or region code.
 *
 * Works for both:
 *  - SKU.countryCode (ISO Alpha-2)
 *  - SKU.regionCode (business region code)
 *
 * Uses static ISO country list internally, but caller can use this for
 * regionCode as long as codes match the expected format.
 */
const CountryRegionCodeDropdown: FC<CountryRegionCodeDropdownProps> = ({
  value,
  onChange,
  label = 'Country / Region Code',
  disabled = false,
  placeholder = 'Select country / region',
  helperText,
}) => {
  const options: OptionType[] = useMemo(() => {
    const items = getCountryCodeItems();

    return items.map((item) => ({
      value: item.code,
      label: `${item.code} — ${item.name}`,
      type: 'country-region',
    }));
  }, []);

  return (
    <Dropdown
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      helperText={helperText}
      searchable
    />
  );
};

export default CountryRegionCodeDropdown;
