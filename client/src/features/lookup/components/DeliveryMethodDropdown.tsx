import { useMemo } from 'react';
import type { DeliveryMethodLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import { faBan, faHelicopter, faStore, faTruck } from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type DeliveryMethodDropdownProps = PaginatedDropdownProps<DeliveryMethodLookupQueryParams>;

/**
 * Dropdown component for selecting a delivery method from the lookup list.
 *
 * - Enriches raw options with UI metadata (`displayLabel`, `icon`, `tooltip`, `iconColor`).
 * - Marks inactive delivery methods with red text and a gray ban icon.
 * - Identifies pickup locations with a store icon and blue highlight.
 * - Detects drone-based delivery methods by keyword and shows a helicopter icon.
 * - Defaults to a truck icon for other active delivery methods.
 * - Always keeps a plain string `label` for Autocomplete input stability, with a `displayLabel` (JSX) for rendering.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and server-driven lookups.
 *
 * @component
 * @param {DeliveryMethodDropdownProps} props - Props controlling dropdown behavior.
 */
const DeliveryMethodDropdown = ({ options = [], ...rest }: DeliveryMethodDropdownProps) => {
  const enrichedDeliveryMethodOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;
          const isPickup = opt.isPickupLocation === true;
          
          // Always keep plain string for Autocomplete input
          const rawLabel = getRawLabel(opt.label);
          
          // JSX version for dropdown rendering
          const displayLabel = (
            <CustomTypography color={isInactive ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );
          
          // Icon logic
          const icon = isInactive
            ? faBan
            : isPickup
              ? faStore
              : rawLabel.toLowerCase().includes('drone')
                ? faHelicopter
                : faTruck;
          
          // Tooltip logic
          const tooltip = isInactive
            ? 'Inactive Delivery Method'
            : isPickup
              ? 'Pickup Location'
              : rawLabel.toLowerCase().includes('drone')
                ? 'Drone Delivery'
                : 'Delivery Method';
          
          const iconColor = isInactive
            ? 'gray'
            : isPickup
              ? 'blue'
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
      label="Select Delivery Method"
      options={enrichedDeliveryMethodOptions}
      {...rest}
    />
  );
};

export default DeliveryMethodDropdown;
