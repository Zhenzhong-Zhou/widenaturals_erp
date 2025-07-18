import type { FC } from 'react';
import Dropdown from '@components/common/Dropdown';

export interface WarehouseOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface WarehouseDropdownProps {
  label: string;
  options: WarehouseOption[];
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  searchable?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const WarehouseDropdown: FC<WarehouseDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  onRefresh,
  searchable = true,
  disabled = false,
  loading = false,
}) => {
  // Optionally filter out disabled warehouses
  const filteredOptions = options.filter((w) => !w.disabled);

  return (
    <Dropdown
      label={label}
      options={filteredOptions}
      value={value}
      onChange={onChange}
      onRefresh={onRefresh}
      searchable={searchable}
      disabled={disabled || loading}
      loading={loading}
      sx={{ width: '250px' }}
    />
  );
};

export default WarehouseDropdown;
