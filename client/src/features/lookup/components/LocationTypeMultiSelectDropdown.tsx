import { type FC } from 'react';
import type { MultiSelectDropdownProps } from '@components/common/MultiSelectDropdown';
import MultiSelectDropdown from '@components/common/MultiSelectDropdown';

/**
 * Location Type-specific multi-select dropdown props.
 *
 * Allows location-type-specific defaults and future extensions.
 */
type LocationTypeMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting location types.
 *
 * Thin semantic wrapper around <MultiSelectDropdown />.
 */
const LocationTypeMultiSelectDropdown: FC<
  LocationTypeMultiSelectDropdownProps
> = ({
  label = 'Select Location Type',
  placeholder = 'Choose location type…',
  ...rest
}) => {
  return (
    <MultiSelectDropdown label={label} placeholder={placeholder} {...rest} />
  );
};

export default LocationTypeMultiSelectDropdown;
