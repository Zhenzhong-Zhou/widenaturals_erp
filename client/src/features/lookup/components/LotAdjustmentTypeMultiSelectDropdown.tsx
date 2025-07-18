import { type FC } from 'react';
import MultiSelectDropdown, {
  type MultiSelectOption,
} from '@components/common/MultiSelectDropdown';

interface LotAdjustmentTypeMultiSelectDropdownProps {
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

/**
 * Reusable multi-select dropdown component for selecting multiple lot adjustment types.
 */
const LotAdjustmentTypeMultiSelectDropdown: FC<
  LotAdjustmentTypeMultiSelectDropdownProps
> = ({
  label = 'Select Lot Adjustment Types',
  options,
  selectedOptions,
  onChange,
  loading,
  disabled,
  error,
  helperText,
  sx,
  placeholder = 'Choose lot adjustment types...',
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

export default LotAdjustmentTypeMultiSelectDropdown;
