import { useMemo } from 'react';
import type { PricingLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import {
  faBan,
  faCalendarTimes,
  faDollarSign,
} from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type PricingDropdownProps = PaginatedDropdownProps<PricingLookupQueryParams>;

/**
 * Dropdown component for selecting a pricing record from the lookup list.
 *
 * Enriches each pricing option with:
 * - `displayLabel`: JSX with conditional color (red if inactive/expired)
 * - `icon`: Contextual icon (`faBan` if inactive, `faCalendarTimes` if expired, `faDollarSign` if active)
 * - `tooltip`: Status-aware tooltip (Inactive, Expired, Active)
 * - `iconColor`: Gray for inactive, orange for expired, green for active
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, filtering (e.g., by SKU ID), and dynamic loading based on display options.
 *
 * @component
 * @param {PricingDropdownProps} props - Standard dropdown props plus lookup state.
 */
const PricingDropdown = ({ options = [], ...rest }: PricingDropdownProps) => {
  const enrichedPricingOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          const isExpired = opt.isValidToday === false;

          // Plain string for Autocomplete input & equality
          const rawLabel = getRawLabel(opt.label);

          // JSX label for dropdown rendering
          const displayLabel = (
            <CustomTypography
              color={isInactive || isExpired ? 'error' : 'inherit'}
            >
              {rawLabel}
            </CustomTypography>
          );

          // Icon logic
          const icon = isInactive
            ? faBan
            : isExpired
              ? faCalendarTimes
              : faDollarSign;

          // Tooltip logic
          const tooltip = isInactive
            ? 'Inactive Pricing'
            : isExpired
              ? 'Expired Pricing'
              : 'Active Pricing';

          // Color logic
          const iconColor = isInactive
            ? 'gray'
            : isExpired
              ? 'orange'
              : 'green';

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
      label="Select Pricing"
      options={enrichedPricingOptions}
      {...rest}
    />
  );
};

export default PricingDropdown;
