import type { DeliveryMethodLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type DeliveryMethodDropdownProps = PaginatedDropdownProps<DeliveryMethodLookupQueryParams>;

/**
 * Dropdown component for selecting a delivery method from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 */
export const DeliveryMethodDropdown = (props: DeliveryMethodDropdownProps) => (
  <PaginatedDropdown label="Select Delivery Method" {...props} />
);

export default DeliveryMethodDropdown;
