import type { PricingLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type PricingDropdownProps = PaginatedDropdownProps<PricingLookupQueryParams>;

/**
 * Dropdown component for selecting a pricing record from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, filtering (e.g., by SKU ID), and dynamic loading based on display options.
 */
export const PricingDropdown = (props: PricingDropdownProps) => (
  <PaginatedDropdown label="Select Pricing" {...props} />
);

export default PricingDropdown;
