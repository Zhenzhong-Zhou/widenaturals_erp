import { type FC, type ReactNode, useMemo } from 'react';
import Dropdown, { type OptionType } from '@components/common/Dropdown';
import {
  SKU_CONSTANTS,
  type VariantCodeItem,
} from '@utils/constants/skuConstants';

interface VariantCodeDropdownProps {
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  helperText?: ReactNode;
}

const VariantCodeDropdown: FC<VariantCodeDropdownProps> = ({
  value,
  onChange,
  label = 'Variant Code',
  disabled = false,
  placeholder = 'Select Variant Code',
  helperText,
}) => {
  // Convert dataset → OptionType[]
  const options: OptionType[] = useMemo(
    () =>
      SKU_CONSTANTS.VARIANT_CODES.map((item: VariantCodeItem) => ({
        value: item.code,
        label: `${item.code} — ${item.label}`,
        type: 'variant',
      })),
    []
  );

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

export default VariantCodeDropdown;
