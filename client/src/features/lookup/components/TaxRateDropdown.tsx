import type { TaxRateLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type TaxRateDropdownProps = PaginatedDropdownProps<TaxRateLookupQueryParams>;

/**
 * Dropdown component for selecting a tax rate from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 */
export const TaxRateDropdown = (props: TaxRateDropdownProps) => (
  <PaginatedDropdown label="Select Tax Rate" {...props} />
);

export default TaxRateDropdown;
