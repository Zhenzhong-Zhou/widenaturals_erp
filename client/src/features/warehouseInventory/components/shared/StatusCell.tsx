import type { LookupOption } from '@features/lookup/state';
import type { RowAwareComponentProps } from '@components/common/MultiItemForm';
import { InventoryStatusDropdown } from '@features/lookup/components';

interface StatusCellProps extends RowAwareComponentProps<string> {
  options: LookupOption[];
  loading: boolean;
}

/**
 * Row-aware inventory status picker for MultiItemForm.
 *
 * Adapts MultiItemForm's row field value/onChange contract to the shared
 * InventoryStatusDropdown, while keeping empty selections normalized as an
 * empty string in form state.
 */
const StatusCell = ({ value, onChange, options, loading }: StatusCellProps) => {
  const handleChange = (nextValue: string | null) => {
    onChange?.(nextValue ?? '');
  };

  return (
    <InventoryStatusDropdown
      value={value ?? null}
      onChange={handleChange}
      options={options}
      loading={loading}
    />
  );
};

export default StatusCell;
