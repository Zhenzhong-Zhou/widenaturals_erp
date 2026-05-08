import { useMemo } from 'react';
import type { InventoryStatusLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import { CustomTypography, PaginatedDropdown } from '@components/index';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type InventoryStatusDropdownProps =
  PaginatedDropdownProps<InventoryStatusLookupParams>;

/**
 * Dropdown component for selecting an inventory status.
 *
 * Highlights inactive inventory statuses.
 *
 * Useful for:
 * - Inventory management
 * - Status-based filtering
 */
const InventoryStatusDropdown = ({
                                   options = [],
                                   fetchParams,
                                   onRefresh,
                                   ...rest
                                 }: InventoryStatusDropdownProps) => {
  const enrichedOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          
          const rawLabel = getRawLabel(opt.label);
          
          return [
            opt.value ?? opt.id,
            {
              ...opt,
              label: rawLabel,
              displayLabel: (
                <CustomTypography color={isInactive ? 'error' : 'inherit'}>
                  {rawLabel}
                </CustomTypography>
              ),
              icon: isInactive ? faBan : faCheck,
              tooltip: isInactive
                ? 'Inactive Inventory Status'
                : 'Active Inventory Status',
              iconColor: isInactive ? 'gray' : 'green',
            },
          ];
        })
      ).values()
    );
  }, [options]);
  
  return (
    <PaginatedDropdown
      label="Select Inventory Status"
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

export default InventoryStatusDropdown;
