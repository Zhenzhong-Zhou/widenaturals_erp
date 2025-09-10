import { useMemo } from 'react';
import type { DiscountLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faHourglassEnd, faPercent } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type DiscountDropdownProps = PaginatedDropdownProps<DiscountLookupQueryParams>;

/**
 * Dropdown component for selecting a discount from the lookup list.
 *
 * - Enriches raw options with UI metadata (`displayLabel`, `icon`, `tooltip`, `iconColor`).
 * - Marks inactive discounts with red text and a gray ban icon.
 * - Marks expired discounts with red text, an orange hourglass icon, and tooltip.
 * - Defaults to a green percent icon for active/valid discounts.
 * - Keeps a plain string `label` for Autocomplete input stability, and a `displayLabel` (JSX) for dropdown rendering.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and server-driven lookups.
 *
 * @component
 * @param {DiscountDropdownProps} props - Props controlling dropdown behavior.
 */
const DiscountDropdown = ({ options = [], ...rest }: DiscountDropdownProps) => {
  const enrichedDiscountOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          const isExpired = opt.isValidToday === false;
          
          // Keep string label
          const rawLabel = getRawLabel(opt.label);
          
          // JSX for rendering
          const displayLabel = (
            <CustomTypography color={isInactive ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );
          
          return [
            opt.value ?? opt.id,
            {
              ...opt,
              label: rawLabel,
              displayLabel,
              icon: isInactive
                ? faBan
                : isExpired
                  ? faHourglassEnd
                  : faPercent,
              tooltip: isInactive
                ? 'Inactive Discount'
                : isExpired
                  ? 'Expired Discount'
                  : 'Active Discount',
              iconColor: isInactive
                ? 'gray'
                : isExpired
                  ? 'orange'
                  : 'green',
            },
          ];
        })
      ).values()
    );
  }, [options]);
  
  return (
    <PaginatedDropdown
      label="Select Discount"
      options={enrichedDiscountOptions}
      {...rest}
    />
  );
};

export default DiscountDropdown;
