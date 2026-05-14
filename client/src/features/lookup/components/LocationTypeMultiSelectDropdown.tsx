import { type FC } from 'react';
import type { MultiSelectDropdownProps } from '@components/common/MultiSelectDropdown';
import { MultiSelectDropdown } from '@components/index';

/**
 * Lot adjustment type-specific multi-select dropdown props.
 *
 * Allows lot-adjustment-specific defaults and future extensions.
 */
type LotAdjustmentTypeMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting lot adjustment types.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const LotAdjustmentTypeMultiSelectDropdown: FC<
  LotAdjustmentTypeMultiSelectDropdownProps
> = ({
       label = 'Select Lot Adjustment Types',
       placeholder = 'Choose lot adjustment types…',
       ...rest
     }) => {
  return (
    <MultiSelectDropdown label={label} placeholder={placeholder} {...rest} />
  );
};

export default LotAdjustmentTypeMultiSelectDropdown;
