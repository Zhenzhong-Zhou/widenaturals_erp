import type { LookupOption } from '@features/lookup/state';
import type { RowAwareComponentProps } from '@components/common/MultiItemForm';
import { InventoryStatusDropdown } from '@features/lookup/components';

interface StatusCellProps extends RowAwareComponentProps {
  options: LookupOption[];
  loading: boolean;
}

const StatusCell = ({ value, onChange, options, loading }: StatusCellProps) => (
  <InventoryStatusDropdown
    value={value ?? null}
    onChange={onChange}
    options={options}
    loading={loading}
  />
);

export default StatusCell;
