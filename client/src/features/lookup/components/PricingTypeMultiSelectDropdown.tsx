import { type FC } from 'react';
import type { MultiSelectDropdownProps } from '@components/common/MultiSelectDropdown';
import { MultiSelectDropdown } from '@components/index';

/**
 * Pricing Type-specific multi-select dropdown props.
 *
 * Allows pricing-type-specific defaults and future extensions.
 */
type PricingTypeMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting pricing types.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const PricingTypeMultiSelectDropdown: FC<
  PricingTypeMultiSelectDropdownProps
> = ({
  label = 'Select Pricing Type',
  placeholder = 'Choose pricing type…',
  ...rest
}) => {
  return (
    <MultiSelectDropdown label={label} placeholder={placeholder} {...rest} />
  );
};

export default PricingTypeMultiSelectDropdown;
