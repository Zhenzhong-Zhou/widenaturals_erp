import { useMemo } from 'react';
import type { GetBatchRegistryLookupParams } from '../state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import {
  faBoxOpen,
  faPills,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type BatchRegistryDropdownProps =
  PaginatedDropdownProps<GetBatchRegistryLookupParams>;

/**
 * Dropdown component for selecting a batch from the batch registry.
 *
 * - Enriches raw batch options with UI metadata (`displayLabel`, `icon`, `tooltip`, `iconColor`).
 * - Distinguishes batch types visually:
 *   - Product batches → pill icon, green color.
 *   - Packaging material batches → box icon, blue color.
 *   - Unknown types → question-circle icon, gray color.
 * - Always keeps a plain string `label` for Autocomplete input stability.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and server-driven lookups.
 *
 * @component
 * @param {BatchRegistryDropdownProps} props - Props controlling dropdown behavior.
 */
const BatchRegistryDropdown = ({
  options = [],
  ...rest
}: BatchRegistryDropdownProps) => {
  const enrichedBatchRegistryOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isProduct = opt.type === 'product';
          const isPackaging = opt.type === 'packaging_material';

          // Keep plain string for Autocomplete input
          const rawLabel = getRawLabel(opt.label);

          // JSX for rendering
          const displayLabel = (
            <CustomTypography color={isProduct ? 'inherit' : 'primary'}>
              {rawLabel}
            </CustomTypography>
          );

          return [
            opt.value,
            {
              ...opt,
              label: rawLabel,
              displayLabel,
              icon: isProduct
                ? faPills // icon for product batches
                : isPackaging
                  ? faBoxOpen // icon for packaging material batches
                  : faQuestionCircle, // fallback
              tooltip: isProduct
                ? 'Product Batch'
                : isPackaging
                  ? 'Packaging Material Batch'
                  : 'Unknown Batch Type',
              iconColor: isProduct ? 'green' : isPackaging ? 'blue' : 'gray',
            },
          ];
        })
      ).values()
    );
  }, [options]);

  return (
    <PaginatedDropdown
      label="Select Batch"
      options={enrichedBatchRegistryOptions}
      {...rest}
    />
  );
};

export default BatchRegistryDropdown;
