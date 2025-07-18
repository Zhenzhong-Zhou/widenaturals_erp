import type { GetBatchRegistryLookupParams } from '../state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type BatchRegistryDropdownProps = PaginatedDropdownProps<GetBatchRegistryLookupParams>;

/**
 * Dropdown component for selecting a batch from the batch registry.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 */
export const BatchRegistryDropdown = (
  props: BatchRegistryDropdownProps
) => (
  <PaginatedDropdown label="Select Batch" {...props} />
);

export default BatchRegistryDropdown;
