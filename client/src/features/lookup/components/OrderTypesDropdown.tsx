import { type FC } from 'react';
import type { LookupOption, OrderTypeLookupQueryParams } from '../state';
import Dropdown from '@components/common/Dropdown';

interface OrderTypeDropdownProps {
  value: string | null;
  orderTypeOptions: LookupOption[];
  orderTypeLoading: boolean;
  orderTypeError: string | null;
  onChange: (value: string) => void;
  onKeywordSearch?: (keyword: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  sx?: object;
  helperText?: string;
  placeholder?: string;
  onRefresh?: (filters?: OrderTypeLookupQueryParams) => void;
  onAddNew?: () => void;
}

const OrderTypeDropdown: FC<OrderTypeDropdownProps> = ({
  value,
  orderTypeOptions,
  orderTypeLoading,
  orderTypeError,
  onChange,
  onKeywordSearch,
  disabled,
  searchable = true,
  sx,
  helperText,
  placeholder = 'Select order type',
  onRefresh,
  onAddNew,
}) => {
  return (
    <Dropdown
      label="Order Type"
      value={value}
      onChange={onChange}
      onInputChange={(_, inputValue) => {
        onKeywordSearch?.(inputValue);
      }}
      options={orderTypeOptions}
      loading={orderTypeLoading}
      error={orderTypeError}
      disabled={disabled}
      searchable={searchable}
      sx={sx}
      helperText={helperText}
      placeholder={placeholder}
      onRefresh={() => onRefresh?.({})}
      onAddNew={onAddNew}
    />
  );
};

export default OrderTypeDropdown;
