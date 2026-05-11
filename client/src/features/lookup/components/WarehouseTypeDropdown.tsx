import { useMemo } from 'react';
import type { WarehouseTypeLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import { CustomTypography, PaginatedDropdown } from '@components/index';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type WarehouseTypeDropdownProps =
  PaginatedDropdownProps<WarehouseTypeLookupParams>;

/**
 * Dropdown component for selecting a warehouse type.
 *
 * Highlights inactive warehouse types.
 *
 * Useful for:
 * - Warehouse setup
 * - Warehouse classification
 */
const WarehouseTypeDropdown = ({
                                 options = [],
                                 fetchParams,
                                 onRefresh,
                                 ...rest
                               }: WarehouseTypeDropdownProps) => {
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
                ? 'Inactive Warehouse Type'
                : 'Active Warehouse Type',
              iconColor: isInactive ? 'gray' : 'green',
            },
          ];
        })
      ).values()
    );
  }, [options]);
  
  return (
    <PaginatedDropdown
      label="Select Warehouse Type"
      options={enrichedOptions}
      onOpen={() => {
        if (!options.length && fetchParams) {
          onRefresh?.(fetchParams);
        }
      }}
      onRefresh={onRefresh}
      fetchParams={fetchParams}
      {...rest}
    />
  );
};

export default WarehouseTypeDropdown;
