import { useMemo } from 'react';
import type { RoleLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type RoleDropdownProps = PaginatedDropdownProps<RoleLookupParams>;

/**
 * Dropdown component for selecting a role lookup item.
 *
 * - Adds UI enrichment: `displayLabel`, `icon`, `tooltip`, and `iconColor`
 * - Highlights inactive roles
 * - Normalizes `label` for stable Autocomplete behavior
 *
 * Useful for:
 * - User role assignment
 * - Admin configuration screens
 * - Permission management UIs
 */
const RoleDropdown = ({
  options = [],
  fetchParams,
  onRefresh,
  ...rest
}: RoleDropdownProps) => {
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

          const tooltip = isInactive ? 'Inactive Role' : 'Active Role';

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
      label="Select Role"
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

export default RoleDropdown;
