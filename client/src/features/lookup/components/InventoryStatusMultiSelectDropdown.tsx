import { type FC } from 'react';
import type { MultiSelectDropdownProps } from '@components/common/MultiSelectDropdown';
import { MultiSelectDropdown } from '@components/index';

/**
 * Inventory Status-specific multi-select dropdown props.
 *
 * Allows inventory-status-specific defaults and future extensions.
 */
type InventoryStatusMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting inventory statuses.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const InventoryStatusMultiSelectDropdown: FC<
  InventoryStatusMultiSelectDropdownProps
> = ({
  label = 'Select Inventory Status',
  placeholder = 'Choose inventory status…',
  ...rest
}) => {
  return (
    <MultiSelectDropdown label={label} placeholder={placeholder} {...rest} />
  );
};

export default InventoryStatusMultiSelectDropdown;
