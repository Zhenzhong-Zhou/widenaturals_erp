import { type FC } from 'react';
import type { MultiSelectDropdownProps } from '@components/common/MultiSelectDropdown';
import { MultiSelectDropdown } from '@components/index';

/**
 * Warehouse Type-specific multi-select dropdown props.
 *
 * Allows warehouse-type-specific defaults and future extensions.
 */
type WarehouseTypeMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting warehouse types.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const WarehouseTypeMultiSelectDropdown: FC<
  WarehouseTypeMultiSelectDropdownProps
> = ({
  label = 'Select Warehouse Type',
  placeholder = 'Choose warehouse type…',
  ...rest
}) => {
  return (
    <MultiSelectDropdown label={label} placeholder={placeholder} {...rest} />
  );
};

export default WarehouseTypeMultiSelectDropdown;
