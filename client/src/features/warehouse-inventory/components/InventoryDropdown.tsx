import { FC } from 'react';
import { Dropdown } from '@components/index.ts';

interface InventoryDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
}

const InventoryDropdown: FC<InventoryDropdownProps> = (props) => {
  return <Dropdown {...props} />;
};

export default InventoryDropdown;
