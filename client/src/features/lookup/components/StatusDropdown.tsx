import { useMemo } from 'react';
import type { StatusLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type StatusDropdownProps =
  PaginatedDropdownProps<StatusLookupParams>;

/**
 * Dropdown component for selecting a Status lookup item.
 *
 * - Adds UI enrichment: `displayLabel`, `icon`, `tooltip`, `iconColor`
 * - Highlights inactive statuses visually (red text + ban icon)
 * - Normalizes `label` for stable Autocomplete behavior
 *
 * @component
 */
const StatusDropdown = ({
                          options = [],
                          fetchParams,
                          onRefresh,
                          ...rest
                        }: StatusDropdownProps) => {
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
            ? 'Inactive Status'
            : 'Active Status';
          
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
      label="Select Status"
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

export default StatusDropdown;
