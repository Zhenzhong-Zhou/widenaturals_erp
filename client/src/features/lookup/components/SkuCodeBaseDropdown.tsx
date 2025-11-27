import { useMemo } from 'react';
import type { SkuCodeBaseLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type SkuCodeBaseDropdownProps =
  PaginatedDropdownProps<SkuCodeBaseLookupParams>;

/**
 * Dropdown component for selecting a SKU Code Base record.
 *
 * - Converts each lookup option into enriched UI metadata:
 *   - `displayLabel` for MUI rendering
 *   - `icon` and `tooltip` based on active/inactive status
 *   - `iconColor`
 * - Normalizes `label` to a plain string for Autocomplete stability.
 *
 * @component
 */
const SkuCodeBaseDropdown = ({
                               options = [],
                               onRefresh,
                               fetchParams,
                               ...rest
                             }: SkuCodeBaseDropdownProps) => {
  const enrichedOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          
          // Raw label string for Autocomplete
          const rawLabel = getRawLabel(opt.label);
          
          // JSX label with conditional styling
          const displayLabel = (
            <CustomTypography color={isInactive ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );
          
          // Icon logic
          const icon = isInactive ? faBan : faCheck;
          
          // Tooltip logic
          const tooltip = isInactive
            ? 'Inactive SKU Code Base'
            : 'Active SKU Code Base';
          
          // Icon coloring
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
      label="Select SKU Code Base"
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

export default SkuCodeBaseDropdown;
