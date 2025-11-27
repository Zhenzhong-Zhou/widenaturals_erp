import { useMemo } from 'react';
import type { ProductLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type ProductDropdownProps =
  PaginatedDropdownProps<ProductLookupParams>;

/**
 * Dropdown component for selecting a product lookup item.
 *
 * - Adds UI enrichment: `displayLabel`, `icon`, `tooltip`, and `iconColor`
 * - Highlights inactive products
 * - Normalizes `label` for stable Autocomplete behavior
 *
 * Useful for SKU creation, BOM flows, order forms, etc.
 *
 * @component
 */
const ProductDropdown = ({
                           options = [],
                           fetchParams,
                           onRefresh,
                           ...rest
                         }: ProductDropdownProps) => {
  const enrichedOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          
          const rawLabel = getRawLabel(opt.label);
          
          const displayLabel = (
            <CustomTypography color={isInactive ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );
          
          const icon = isInactive ? faBan : faCheck;
          
          const tooltip = isInactive
            ? 'Inactive Product'
            : 'Active Product';
          
          const iconColor = isInactive ? 'gray' : 'green';
          
          return [
            opt.value ?? opt.id,
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
  }, [options]);
  
  return (
    <PaginatedDropdown
      label="Select Product"
      options={enrichedOptions}
      onOpen={() => {
        if (!options.length) {
          onRefresh?.(fetchParams);
        }
      }}
      onRefresh={onRefresh}
      fetchParams={fetchParams}
      {...rest}
    />
  );
};

export default ProductDropdown;
