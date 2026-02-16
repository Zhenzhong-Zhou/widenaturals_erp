import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

/**
 * Manufacturer-specific multi-select dropdown props.
 *
 * Allows manufacturer-specific defaults and future extensions.
 */
type ManufacturerMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting manufacturers.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const ManufacturerMultiSelectDropdown: FC<
  ManufacturerMultiSelectDropdownProps
> = ({
       label = 'Select Manufacturer',
       placeholder = 'Choose manufacturer…',
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

export default ManufacturerMultiSelectDropdown;
