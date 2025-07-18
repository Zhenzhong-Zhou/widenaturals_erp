import type { FC } from 'react';
import MultiSelectDropdown, {
  type MultiSelectOption,
} from '@components/common/MultiSelectDropdown';

interface WarehouseMultiSelectDropdownProps {
  label?: string;
  options: MultiSelectOption[];
  selectedOptions: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  sx?: object;
  placeholder?: string;
}

const WarehouseMultiSelectDropdown: FC<WarehouseMultiSelectDropdownProps> = ({
  label = 'Select Warehouses',
  options,
  selectedOptions,
  onChange,
  loading,
  disabled,
  error,
  helperText,
  sx,
  placeholder = 'Choose warehouses...',
}) => {
  return (
    <MultiSelectDropdown
      label={label}
      options={options}
      selectedOptions={selectedOptions}
      onChange={onChange}
      loading={loading}
      disabled={disabled}
      error={error}
      helperText={helperText}
      sx={sx}
      placeholder={placeholder}
    />
  );
};

export default WarehouseMultiSelectDropdown;
