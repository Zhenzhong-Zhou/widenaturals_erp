import { useMemo } from 'react';
import type { CustomerLookupQuery } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import {
  faBan,
  faMapMarkerAlt,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import CustomTypography from '@components/common/CustomTypography';
import { getRawLabel } from '@utils/labelHelpers';

type CustomerDropdownProps = PaginatedDropdownProps<CustomerLookupQuery>;

/**
 * Dropdown component for selecting a customer from the lookup list.
 *
 * - Enriches raw options with UI metadata (`displayLabel`, `icon`, `tooltip`, `iconColor`).
 * - Marks inactive customers visually (red text, gray ban icon).
 * - Highlights customers with/without addresses using location icons and tooltips.
 * - Always keeps a plain string `label` for Autocomplete input stability.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and server-driven lookups.
 *
 * @component
 * @param {CustomerDropdownProps} props - Props controlling dropdown behavior.
 */
const CustomerDropdown = ({ options = [], ...rest }: CustomerDropdownProps) => {
  const enrichedCustomerOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const hasAddress = opt.hasAddress ?? false;
          const isInactive = opt.isActive === false;

          // Keep plain string for Autocomplete
          const rawLabel = getRawLabel(opt.label);

          // JSX version for dropdown rendering
          const displayLabel = (
            <CustomTypography color={isInactive ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );

          return [
            opt.value,
            {
              ...opt,
              label: rawLabel,
              displayLabel,
              icon: isInactive
                ? faBan
                : hasAddress
                  ? faMapMarkerAlt
                  : faQuestionCircle,
              tooltip: isInactive
                ? 'Inactive Customer'
                : hasAddress
                  ? 'Has Address'
                  : 'No Address',
              iconColor: isInactive ? 'gray' : hasAddress ? 'green' : 'orange',
            },
          ];
        })
      ).values()
    );
  }, [options]);

  return (
    <PaginatedDropdown
      label="Select Customer"
      options={enrichedCustomerOptions}
      {...rest}
    />
  );
};

export default CustomerDropdown;
