import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

/**
 * Status-specific multi-select dropdown props.
 *
 * Thin semantic wrapper around MultiSelectDropdown.
 * Allows defaults and future status-only extensions.
 */
type StatusMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

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
  paginationMeta,
  inputValue,
  onInputChange,
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
      paginationMeta={paginationMeta}
      inputValue={inputValue}
      onInputChange={onInputChange}
    />
  );
};

export default StatusMultiSelectDropdown;
