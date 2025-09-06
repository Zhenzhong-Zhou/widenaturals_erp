import { type FC, useMemo } from 'react';
import Dropdown from '@components/common/Dropdown';
import type { AllocationStrategy } from '@features/inventoryAllocation/state/inventoryAllocationTypes';

interface StrategyDropdownProps {
  value: AllocationStrategy;
  onChange: (value: AllocationStrategy) => void;
  disabled?: boolean;
}

const STRATEGY_OPTIONS: { value: AllocationStrategy; label: string }[] = [
  { value: 'fifo', label: 'FIFO (First-In First-Out)' },
  { value: 'fefo', label: 'FEFO (First-Expiry First-Out)' },
  { value: 'lifo', label: 'LIFO (Last-In First-Out)' },
  { value: 'custom', label: 'Custom Strategy' },
];

const StrategyDropdown: FC<StrategyDropdownProps> = ({ value, onChange, disabled }) => {
  const options = useMemo(() => STRATEGY_OPTIONS, []);
  
  return (
    <Dropdown
      label="Allocation Strategy"
      value={value}
      onChange={(val) => onChange(val as AllocationStrategy)}
      options={options}
      disabled={disabled}
      placeholder="Select strategy"
      helperText="Choose how inventory should be allocated"
    />
  );
};

export default StrategyDropdown;
