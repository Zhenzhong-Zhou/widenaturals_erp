import type { PackagingMaterialLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type PackagingMaterialDropdownProps =
  PaginatedDropdownProps<PackagingMaterialLookupQueryParams>;

/**
 * Dropdown component for selecting a packaging material from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and sales/generic modes via query params.
 */
export const PackagingMaterialDropdown = (props: PackagingMaterialDropdownProps) => (
  <PaginatedDropdown label="Select Packaging Material" {...props} />
);

export default PackagingMaterialDropdown;
