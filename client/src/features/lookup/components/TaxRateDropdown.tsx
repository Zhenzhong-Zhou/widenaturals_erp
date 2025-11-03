import { useMemo } from 'react';
import type { TaxRateLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import {
  faBan,
  faCalendarTimes,
  faPercent,
} from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type TaxRateDropdownProps = PaginatedDropdownProps<TaxRateLookupQueryParams>;

/**
 * Dropdown component for selecting a tax rate from the lookup list.
 *
 * Enriches each tax rate option with:
 * - `displayLabel`: JSX label (red if inactive or expired)
 * - `icon`: Contextual icon (`faBan` if inactive, `faCalendarTimes` if expired, `faPercent` if active)
 * - `tooltip`: Explains the current state (inactive, expired, or active tax rate)
 * - `iconColor`: Gray for inactive, orange for expired, green for active
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and server-driven lookups.
 *
 * @component
 * @param {TaxRateDropdownProps} props - Standard dropdown props with tax rate lookup data.
 */
const TaxRateDropdown = ({ options = [], ...rest }: TaxRateDropdownProps) => {
  const enrichedTaxRateOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          const isExpired = opt.isValidToday === false;

          // Always normalize to plain string for Autocomplete
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
              : faPercent;

          // Tooltip logic
          const tooltip = isInactive
            ? 'Inactive Tax Rate'
            : isExpired
              ? 'Expired Tax Rate'
              : 'Active Tax Rate';

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
      label="Select Tax Rate"
      options={enrichedTaxRateOptions}
      {...rest}
    />
  );
};

export default TaxRateDropdown;
