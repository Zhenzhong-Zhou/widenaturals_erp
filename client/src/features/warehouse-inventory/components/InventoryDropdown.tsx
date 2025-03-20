import { FC } from 'react';
import { Dropdown } from '@components/index.ts';

interface InventoryOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface InventoryDropdownProps {
  label: string;
  options: InventoryOption[];
  value: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
  searchable?: boolean;
}

const InventoryDropdown: FC<InventoryDropdownProps> = ({
  options,
  onRefresh,
  ...props
}) => {
  // Custom behavior: Filter out disabled inventory items
  const filteredOptions = options.filter((item) => !item.disabled);

  return (
    <Dropdown {...props} options={filteredOptions} onRefresh={onRefresh} sx={{ width: '250px' }} />
  );
};

export default InventoryDropdown;
