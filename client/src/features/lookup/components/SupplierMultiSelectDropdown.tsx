import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

/**
 * Supplier-specific multi-select dropdown props.
 *
 * Allows supplier-specific defaults and future extensions.
 */
type SupplierMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting suppliers.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const SupplierMultiSelectDropdown: FC<
  SupplierMultiSelectDropdownProps
> = ({
       label = 'Select Supplier',
       placeholder = 'Choose supplier…',
       ...rest
     }) => {
  return (
    <MultiSelectDropdown
      label={label}
      placeholder={placeholder}
      {...rest}
    />
  );
};

export default SupplierMultiSelectDropdown;
