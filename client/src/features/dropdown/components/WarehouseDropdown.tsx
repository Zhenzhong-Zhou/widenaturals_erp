import { type FC } from 'react';
import Dropdown from '@components/common/Dropdown';
import type { GetWarehouseDropdownFilters } from '@features/dropdown/state';

interface WarehouseDropdownProps {
  label?: string;
  value: string | null;
  warehouseDropdownOptions: { value: string; label: string }[];
  warehouseDropdownLoading?: boolean;
  warehouseDropdownError?: string | null;
  onChange: (value: string) => void;
  onRefresh: (params: GetWarehouseDropdownFilters) => void;
  onAddNew?: () => void;
  disabled?: boolean;
}

const WarehouseDropdown: FC<WarehouseDropdownProps> = ({
                                                         label = 'Select Warehouse',
                                                         value,
                                                         warehouseDropdownOptions,
                                                         onChange,
                                                         warehouseDropdownLoading = false,
                                                         warehouseDropdownError = null,
                                                         onRefresh,
                                                         onAddNew,
                                                         disabled = false,
                                                       }) => {
  return (
    <Dropdown
      label={label}
      value={value}
      options={warehouseDropdownOptions}
      onChange={onChange}
      loading={warehouseDropdownLoading}
      error={warehouseDropdownError}
      onRefresh={() => onRefresh?.({})}
      onAddNew={onAddNew}
      disabled={disabled}
    />
  );
};

export default WarehouseDropdown;
