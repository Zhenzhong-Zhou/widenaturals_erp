import type { CustomerLookupQuery } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type CustomerDropdownProps = PaginatedDropdownProps<CustomerLookupQuery>;

/**
 * Dropdown component for selecting a customer from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 */
export const CustomerDropdown = (props: CustomerDropdownProps) => (
  <PaginatedDropdown label="Select Customer" {...props} />
);

export default CustomerDropdown;
