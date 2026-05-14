import { type FC } from 'react';
import type { MultiSelectDropdownProps } from '@components/common/MultiSelectDropdown';
import { MultiSelectDropdown } from '@components/index';

/**
 * Location-specific multi-select dropdown props.
 *
 * Allows location-specific defaults and future extensions.
 */
type LocationMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting locations.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const LocationMultiSelectDropdown: FC<LocationMultiSelectDropdownProps> = ({
  label = 'Select Location',
  placeholder = 'Choose location…',
  ...rest
}) => {
  return (
    <MultiSelectDropdown label={label} placeholder={placeholder} {...rest} />
  );
};

export default LocationMultiSelectDropdown;
