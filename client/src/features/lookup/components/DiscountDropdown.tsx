import type { DiscountLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type DiscountDropdownProps = PaginatedDropdownProps<DiscountLookupQueryParams>;

/**
 * Dropdown component for selecting a discount from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 */
export const DiscountDropdown = (props: DiscountDropdownProps) => (
  <PaginatedDropdown label="Select Discount" {...props} />
);

export default DiscountDropdown;
