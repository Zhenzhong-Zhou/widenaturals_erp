import type { SkuLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type SkuDropdownProps = PaginatedDropdownProps<SkuLookupQueryParams>;

/**
 * Dropdown component for selecting a SKU from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Designed to support pagination, filtering, and dynamic loading.
 */
export const SkuDropdown = (props: SkuDropdownProps) => (
  <PaginatedDropdown label="Select SKU" {...props} />
);

export default SkuDropdown;
