import { useMemo } from 'react';
import type { SkuLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import {
  faBan,
  faCheckCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type SkuDropdownProps = PaginatedDropdownProps<SkuLookupQueryParams>;

/**
 * Dropdown component for selecting a SKU from the lookup list.
 *
 * Enriches each SKU option with:
 * - `displayLabel`: JSX with conditional color (red if not normal)
 * - `icon`: Contextual icon (`faBan` if abnormal, `faExclamationTriangle` if issues, `faCheckCircle` if valid)
 * - `tooltip`: Status-aware tooltip (valid, not valid, or specific issue reasons)
 * - `iconColor`: Gray for abnormal, orange for issues, green for valid
 * - `isNormal`: Boolean derived from server flags or computed validation
 * - `hasIssues`: Boolean true if issueReasons exist
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and dynamic loading for large SKU lists.
 *
 * @component
 * @param {SkuDropdownProps} props - Standard dropdown props plus SKU lookup state.
 */
const SkuDropdown = ({ options = [], ...rest }: SkuDropdownProps) => {
  const enrichedSkuOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isNormal = opt.isNormal === true;
          const hasIssues =
            Array.isArray(opt.issueReasons) && opt.issueReasons.length > 0;

          // Keep plain string for internal label
          const rawLabel = getRawLabel(opt.label);

          // JSX for dropdown rendering
          const displayLabel = (
            <CustomTypography color={!isNormal ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );

          let tooltip: string;
          if (!isNormal) {
            tooltip = 'SKU is not in valid status';
          } else if (hasIssues) {
            tooltip = opt.issueReasons?.join(', ') || 'This SKU has issues';
          } else {
            tooltip = 'SKU is valid and ready';
          }

          let icon, iconColor;
          if (!isNormal) {
            icon = faBan;
            iconColor = 'gray';
          } else if (hasIssues) {
            icon = faExclamationTriangle;
            iconColor = 'orange';
          } else {
            icon = faCheckCircle;
            iconColor = 'green';
          }

          return [
            opt.value,
            {
              ...opt,
              label: rawLabel,
              displayLabel,
              tooltip,
              icon,
              iconColor,
              isNormal,
              hasIssues,
            },
          ];
        })
      ).values()
    );
  }, [options]);

  return (
    <PaginatedDropdown
      label="Select SKU"
      options={enrichedSkuOptions}
      {...rest}
    />
  );
};

export default SkuDropdown;
