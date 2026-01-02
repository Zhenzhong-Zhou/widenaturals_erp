import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

type SkuMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting SKUs.
 *
 * Mirrors ProductMultiSelectDropdown and StatusMultiSelectDropdown
 * for consistent API and usage.
 */
const SkuMultiSelectDropdown: FC<SkuMultiSelectDropdownProps> = ({
  label = 'Select SKU',
  options,
  selectedOptions,
  onChange,
  onOpen,
  loading,
  disabled,
  error,
  helperText,
  sx,
  placeholder = 'Choose SKU…',
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

export default SkuMultiSelectDropdown;
