import type { PackagingMaterialLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import { useMemo } from 'react';
import CustomTypography from '@components/common/CustomTypography';
import { faArchive, faBan, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type PackagingMaterialDropdownProps =
  PaginatedDropdownProps<PackagingMaterialLookupQueryParams>;

/**
 * Dropdown component for selecting a packaging material from the lookup list.
 *
 * - Enriches raw options with UI metadata (`displayLabel`, `icon`, `tooltip`, `iconColor`).
 * - Marks inactive or archived items visually (red text, gray icons).
 * - Always keeps a plain string `label` for Autocomplete input stability.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and integration with server-driven lookups.
 *
 * @component
 * @param {PackagingMaterialDropdownProps} props - Props controlling dropdown behavior.
 */
const PackagingMaterialDropdown = ({
  options = [],
  ...rest
}: PackagingMaterialDropdownProps) => {
  const enrichedPackagingMaterialOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          const isArchived = opt.isArchived === true;

          // Plain string for Autocomplete
          const rawLabel = getRawLabel(opt.label);

          // JSX label for dropdown rendering
          const displayLabel = (
            <CustomTypography
              color={isInactive || isArchived ? 'error' : 'inherit'}
            >
              {rawLabel}
            </CustomTypography>
          );

          // Icon logic
          const icon = isArchived ? faArchive : isInactive ? faBan : faBoxOpen;

          // Tooltip logic
          const tooltip = isArchived
            ? 'Archived Packaging Material'
            : isInactive
              ? 'Inactive Packaging Material'
              : 'Active Packaging Material';

          // Color logic
          const iconColor = isArchived ? 'gray' : isInactive ? 'gray' : 'green';

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
      label="Select Packaging Material"
      options={enrichedPackagingMaterialOptions}
      {...rest}
    />
  );
};

export default PackagingMaterialDropdown;
