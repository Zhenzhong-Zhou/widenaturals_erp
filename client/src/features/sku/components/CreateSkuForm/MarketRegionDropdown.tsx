import { type FC, type ReactNode, useMemo } from 'react';
import Dropdown, { type OptionType } from '@components/common/Dropdown';
import {
  SKU_CONSTANTS,
  type MarketRegionCodeItem,
} from '@utils/constants/skuConstants';

interface MarketRegionDropdownProps {
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  helperText?: ReactNode;
}

const MarketRegionDropdown: FC<MarketRegionDropdownProps> = ({
  value,
  onChange,
  label = 'Market Region',
  disabled = false,
  placeholder = 'Select Market Region',
  helperText,
}) => {
  const options: OptionType[] = useMemo(
    () =>
      SKU_CONSTANTS.REGION_CODES.map((item: MarketRegionCodeItem) => ({
        value: item.value,
        label: item.label,
        type: 'market_region',
      })),
    []
  );

  return (
    <Dropdown
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      helperText={helperText}
      searchable
    />
  );
};

export default MarketRegionDropdown;
