import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

/**
 * Product-specific multi-select dropdown props.
 *
 * - Inherits all base multi-select behavior
 * - Allows product-specific defaults and future extensions
 */
type ProductMultiSelectDropdownProps =
  Omit<MultiSelectDropdownProps, 'label' | 'placeholder'> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting products.
 *
 * Thin wrapper around <MultiSelectDropdown /> to provide
 * semantic clarity and future extension points.
 */
const ProductMultiSelectDropdown: FC<ProductMultiSelectDropdownProps> = ({
                                                                           label = 'Select Product',
                                                                           options,
                                                                           selectedOptions,
                                                                           onChange,
                                                                           onOpen,
                                                                           loading,
                                                                           disabled,
                                                                           error,
                                                                           helperText,
                                                                           sx,
                                                                           placeholder = 'Choose product…',
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

export default ProductMultiSelectDropdown;
