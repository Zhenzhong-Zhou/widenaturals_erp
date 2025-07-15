import { type FC } from 'react';
import Dropdown from '@components/common/Dropdown';

interface WarehouseDropdownProps {
  label?: string;
  value: string | null;
  warehouseLookupOptions: { value: string; label: string }[];
  warehouseLookupLoading?: boolean;
  warehouseLookupError?: string | null;
  onChange: (value: string) => void;
  onRefresh?: (filters?: { warehouseTypeId?: string }) => void;
  onAddNew?: () => void;
  disabled?: boolean;
}

const WarehouseDropdown: FC<WarehouseDropdownProps> = ({
  label = 'Select Warehouse',
  value,
  warehouseLookupOptions,
  onChange,
  warehouseLookupLoading = false,
  warehouseLookupError = null,
  onRefresh,
  onAddNew,
  disabled = false,
}) => {
  return (
    <Dropdown
      label={label}
      value={value}
      options={warehouseLookupOptions}
      onChange={onChange}
      loading={warehouseLookupLoading}
      error={warehouseLookupError}
      onRefresh={() => onRefresh?.({})}
      onAddNew={onAddNew}
      disabled={disabled}
    />
  );
};

export default WarehouseDropdown;
