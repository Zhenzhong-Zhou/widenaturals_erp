import { useMemo } from 'react';
import type {
  BatchRegistryLookupItem,
  BatchRegistryLookupQuery,
  BatchRegistryOption,
} from '@features/lookup';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import {
  faBoxOpen,
  faPills,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import {
  composeBatchLabel,
  expirySeverityToChipColor,
  expirySeverityToColor,
  getBatchExpiryMeta,
} from '@features/lookup/utils/batchRegistryUtils';
import { CustomTypography, PaginatedDropdown, StatusChip } from '@components/index';
import Box from '@mui/material/Box';

export type BatchRegistryDropdownProps<
  TQuery extends BatchRegistryLookupQuery = BatchRegistryLookupQuery,
> = Omit<PaginatedDropdownProps<TQuery>, 'options'> & {
  options: BatchRegistryLookupItem[];
};

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
const BatchRegistryDropdown = <
  TQuery extends BatchRegistryLookupQuery = BatchRegistryLookupQuery,
>({
    options = [],
    ...rest
  }: BatchRegistryDropdownProps<TQuery>) => {
  const enrichedBatchRegistryOptions: BatchRegistryOption[] = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isProduct = opt.type === 'product';
          const isPackaging = opt.type === 'packaging_material';
          
          const rawLabel = composeBatchLabel(opt);
          const expiryMeta = getBatchExpiryMeta(opt);
          
          // Severity overrides the type-based color when an expiry exists
          const iconColor = expiryMeta.hasExpiryDate
            ? expirySeverityToColor(expiryMeta.expirySeverity)
            : isProduct
              ? 'green'
              : isPackaging
                ? 'blue'
                : 'gray';
          
          const displayLabel = (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CustomTypography color={isProduct ? 'inherit' : 'primary'}>
                {rawLabel}
              </CustomTypography>
              
              {expiryMeta.hasExpiryDate && expiryMeta.expirySeverity !== 'normal' && (
                <StatusChip
                  label={
                    expiryMeta.isExpired
                      ? 'Expired'
                      : `Expires in ${expiryMeta.daysUntilExpiry}d`
                  }
                  color={expirySeverityToChipColor(expiryMeta.expirySeverity)}
                  size="small"
                />
              )}
            </Box>
          );
          
          return [
            opt.id,
            {
              value: opt.id,
              label: rawLabel,
              type: opt.type,
              displayLabel,
              icon: isProduct ? faPills : isPackaging ? faBoxOpen : faQuestionCircle,
              tooltip: isProduct
                ? 'Product Batch'
                : isPackaging
                  ? 'Packaging Material Batch'
                  : 'Unknown Batch Type',
              iconColor,
              ...expiryMeta,
            } satisfies BatchRegistryOption,
          ];
        })
      ).values()
    );
  }, [options]);
  
  return (
    <PaginatedDropdown<TQuery>
      label="Select Batch"
      options={enrichedBatchRegistryOptions}
      {...rest}
    />
  );
};

export default BatchRegistryDropdown;
