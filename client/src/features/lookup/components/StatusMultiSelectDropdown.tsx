import { type FC } from 'react';
import MultiSelectDropdown, {
  type MultiSelectOption,
} from '@components/common/MultiSelectDropdown';

interface StatusMultiSelectDropdownProps {
  label?: string;
  options: MultiSelectOption[];
  selectedOptions: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  onOpen?: () => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  sx?: object;
  placeholder?: string;
}

/**
 * Reusable multi-select dropdown for selecting product or item statuses.
 * Mirrors the structure and behavior of LotAdjustmentTypeMultiSelectDropdown.
 */
const StatusMultiSelectDropdown: FC<StatusMultiSelectDropdownProps> = ({
                                                                         label = 'Select Status',
                                                                         options,
                                                                         selectedOptions,
                                                                         onChange,
                                                                         onOpen,
                                                                         loading,
                                                                         disabled,
                                                                         error,
                                                                         helperText,
                                                                         sx,
                                                                         placeholder = 'Choose status…',
                                                                       }) => {
  return (
    <MultiSelectDropdown
      label={label}
      options={options}
      selectedOptions={selectedOptions}
      onChange={onChange}
      onOpen={onOpen}
      loading={loading}
      disabled={disabled}
      error={error}
      helperText={helperText}
      sx={sx}
      placeholder={placeholder}
    />
  );
};

export default StatusMultiSelectDropdown;
