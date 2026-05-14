import { useMemo } from 'react';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { InventoryActionTypeLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import { CustomTypography, PaginatedDropdown } from '@components/index';
import { getRawLabel } from '@utils/labelHelpers';

type InventoryActionTypeDropdownProps =
  PaginatedDropdownProps<InventoryActionTypeLookupParams>;

/**
 * Dropdown component for selecting an inventory action type.
 *
 * - Normalizes `label` for stable Autocomplete behavior
 * - Dedupes options by value to guard against duplicates from paginated fetches
 * - Highlights inactive types when surfaced by the backend (callers without
 *   VIEW_ALL_STATUSES only see active types and never hit the inactive
 *   branch; callers with the permission see both, visually distinguished)
 *
 * Used for audit log filters, adjustment workflows, system action
 * selection, etc. The parent category (adjustment, transaction, system,
 * etc.) is surfaced as the option's sub-label by the backend transformer.
 */
const InventoryActionTypeDropdown = ({
                                       options = [],
                                       fetchParams,
                                       onRefresh,
                                       ...rest
                                     }: InventoryActionTypeDropdownProps) => {
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
                ? 'Inactive Inventory Action Type'
                : 'Active Inventory Action Type',
              iconColor: isInactive ? 'gray' : 'green',
            },
          ];
        })
      ).values()
    );
  }, [options]);
  
  return (
    <PaginatedDropdown
      label="Select Inventory Action Type"
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

export default InventoryActionTypeDropdown;
