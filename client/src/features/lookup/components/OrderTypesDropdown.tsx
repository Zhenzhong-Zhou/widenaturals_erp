import { useMemo, type FC, type ReactNode } from 'react';
import type { OrderTypeLookupQueryParams } from '../state';
import Dropdown, { type OptionType } from '@components/common/Dropdown';
import {
  faBan,
  faCheckCircle,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import CustomTypography from '@components/common/CustomTypography';
import { getRawLabel } from '@utils/labelHelpers';

interface OrderTypeDropdownProps {
  value: string | null;
  orderTypeOptions: OptionType[];
  orderTypeLoading: boolean;
  orderTypeError: string | null;
  onChange: (value: string) => void;
  onKeywordSearch?: (keyword: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  sx?: object;
  helperText?: ReactNode;
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
  const enrichedOrderTypeOptions = useMemo(() => {
    return Array.from(
      new Map(
        orderTypeOptions.map((opt) => {
          const requiresPay = opt.isRequiredPayment === true;
          const isInactive = opt.isActive === false;
          
          const rawLabel = getRawLabel(opt.label);
          
          const displayLabel = (
            <CustomTypography color={isInactive ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );
          
          let icon, tooltip, iconColor;
          
          if (isInactive && requiresPay) {
            // Case 1: Inactive + Payment required
            icon = faBan;
            tooltip = 'Inactive order type (Payment Required)';
            iconColor = 'gray';
          } else if (isInactive) {
            // Case 2: Inactive only
            icon = faBan;
            tooltip = 'Inactive order type';
            iconColor = 'gray';
          } else if (requiresPay) {
            // Case 3: Active + Payment required
            icon = faCreditCard;
            tooltip = 'Payment Required';
            iconColor = 'orange';
          } else {
            // Case 4: Active only
            icon = faCheckCircle;
            tooltip = 'Active order type';
            iconColor = 'green';
          }
          
          return [
            opt.value,
            {
              ...opt,
              label: rawLabel,
              displayLabel,
              icon,
              tooltip,
              iconColor,
            },
          ];
        })
      ).values()
    );
  }, [orderTypeOptions]);
  
  return (
    <Dropdown
      label="Order Type"
      value={value}
      onChange={onChange}
      onInputChange={(_, inputValue, reason) => {
        if (reason === 'input') {
          onKeywordSearch?.(inputValue);
        }
      }}
      options={enrichedOrderTypeOptions}
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
