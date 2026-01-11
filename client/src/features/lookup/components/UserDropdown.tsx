import { useMemo } from 'react';
import type { UserLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type UserDropdownProps = PaginatedDropdownProps<UserLookupParams>;

/**
 * Dropdown component for selecting a user lookup item.
 *
 * - Supports `subLabel` (e.g. email) as secondary display text
 * - Highlights inactive users
 * - Normalizes `label` for stable Autocomplete behavior
 *
 * Used for assignment, approvals, ownership, admin workflows, etc.
 *
 * @component
 */
const UserDropdown = ({
                        options = [],
                        fetchParams,
                        onRefresh,
                        ...rest
                      }: UserDropdownProps) => {
  const enrichedOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          
          const rawLabel = getRawLabel(opt.label);
          const rawSubLabel = opt.subLabel;
          
          const displayLabel = (
            <div>
              <CustomTypography
                color={isInactive ? 'error' : 'inherit'}
              >
                {rawLabel}
              </CustomTypography>
              
              {rawSubLabel && (
                <CustomTypography
                  variant="caption"
                  color="text.secondary"
                >
                  {rawSubLabel}
                </CustomTypography>
              )}
            </div>
          );
          
          const icon = isInactive ? faBan : faCheck;
          const tooltip = isInactive
            ? 'Inactive User'
            : 'Active User';
          
          const iconColor = isInactive ? 'gray' : 'green';
          
          return [
            opt.value ?? opt.id,
            {
              ...opt,
              // IMPORTANT: keep label primitive for Autocomplete
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
      label="Select User"
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

export default UserDropdown;
