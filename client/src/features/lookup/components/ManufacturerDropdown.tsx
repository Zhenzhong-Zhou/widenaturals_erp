import { useMemo } from 'react';
import type { ManufacturerLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type ManufacturerDropdownProps =
  PaginatedDropdownProps<ManufacturerLookupParams>;

/**
 * Dropdown component for selecting a manufacturer.
 *
 * Highlights inactive manufacturers and normalizes labels.
 *
 * Useful for:
 * - Product batch creation
 * - Compliance flows
 * - Procurement workflows
 */
const ManufacturerDropdown = ({
  options = [],
  fetchParams,
  onRefresh,
  ...rest
}: ManufacturerDropdownProps) => {
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
                ? 'Inactive Manufacturer'
                : 'Active Manufacturer',
              iconColor: isInactive ? 'gray' : 'green',
            },
          ];
        })
      ).values()
    );
  }, [options]);

  return (
    <PaginatedDropdown
      label="Select Manufacturer"
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

export default ManufacturerDropdown;
