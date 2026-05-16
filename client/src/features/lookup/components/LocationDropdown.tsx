import { useMemo } from 'react';
import type { LocationLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import { CustomTypography, PaginatedDropdown } from '@components/index';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type LocationDropdownProps = PaginatedDropdownProps<LocationLookupParams>;

/**
 * Dropdown component for selecting a location.
 *
 * Highlights inactive locations.
 *
 * Useful for:
 * - Location selection
 * - Warehouse and address pickers
 */
const LocationDropdown = ({
  options = [],
  fetchParams,
  onRefresh,
  ...rest
}: LocationDropdownProps) => {
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
              tooltip: isInactive ? 'Inactive Location' : 'Active Location',
              iconColor: isInactive ? 'gray' : 'green',
            },
          ];
        })
      ).values()
    );
  }, [options]);

  return (
    <PaginatedDropdown
      label="Select Location"
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

export default LocationDropdown;
