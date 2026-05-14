import { type FC } from 'react';
import type { MultiSelectDropdownProps } from '@components/common/MultiSelectDropdown';
import { MultiSelectDropdown } from '@components/index';

/**
 * Inventory action type-specific multi-select dropdown props.
 *
 * Allows inventory-action-type-specific defaults and future extensions.
 */
type InventoryActionTypeMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting inventory action types.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const InventoryActionTypeMultiSelectDropdown: FC<
  InventoryActionTypeMultiSelectDropdownProps
> = ({
  label = 'Select Inventory Action Types',
  placeholder = 'Choose inventory action types…',
  ...rest
}) => {
  return (
    <MultiSelectDropdown label={label} placeholder={placeholder} {...rest} />
  );
};

export default InventoryActionTypeMultiSelectDropdown;
