import { useMemo } from 'react';
import type { PricingTypeLookupParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import { CustomTypography, PaginatedDropdown } from '@components/index';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type PricingTypeDropdownProps = PaginatedDropdownProps<PricingTypeLookupParams>;

/**
 * Dropdown component for selecting a pricing type.
 *
 * Highlights inactive pricing types.
 *
 * Useful for:
 * - Pricing configuration
 * - Price list management
 */
const PricingTypeDropdown = ({
  options = [],
  fetchParams,
  onRefresh,
  ...rest
}: PricingTypeDropdownProps) => {
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
                ? 'Inactive Pricing Type'
                : 'Active Pricing Type',
              iconColor: isInactive ? 'gray' : 'green',
            },
          ];
        })
      ).values()
    );
  }, [options]);

  return (
    <PaginatedDropdown
      label="Select Pricing Type"
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

export default PricingTypeDropdown;
