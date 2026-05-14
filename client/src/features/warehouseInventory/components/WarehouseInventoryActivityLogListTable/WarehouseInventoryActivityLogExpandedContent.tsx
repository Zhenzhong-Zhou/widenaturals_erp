import { type FC } from 'react';
import { Box } from '@mui/material';
import { CustomTypography, DetailsSection } from '@components/index';
import type { InventoryActivityLogRecord } from '@features/warehouseInventory';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

interface WarehouseInventoryActivityLogExpandedContentProps {
  row: InventoryActivityLogRecord;
}

const getDisplayValue = (value: string | null | undefined) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const formatMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return 'Unable to display metadata.';
  }
};

const WarehouseInventoryActivityLogExpandedContent: FC<
  WarehouseInventoryActivityLogExpandedContentProps
> = ({ row }) => {
  const hasProductContext = Boolean(
    row.productName || row.sku || row.productLotNumber
  );

  const hasPackagingContext = Boolean(
    row.packagingDisplayName ||
    row.packagingMaterialCode ||
    row.packagingLotNumber
  );

  const metadataText = formatMetadata(row.metadata);

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Box mb={2}>
        <CustomTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Activity Log Details
        </CustomTypography>
      </Box>

      {/* ── Activity ─────────────────────────────────────────────── */}
      <DetailsSection
        sectionTitle="Activity"
        fields={[
          {
            label: 'Performed At',
            value: row.performedAt,
            format: formatDateTime,
          },
          {
            label: 'Performed By',
            value: getDisplayValue(row.performedByName),
          },
          {
            label: 'Action',
            value: getDisplayValue(row.actionTypeName),
            format: formatLabel,
          },
          {
            label: 'Action Category',
            value: getDisplayValue(row.actionTypeCategory),
            format: formatLabel,
          },
          {
            label: 'Adjustment Type',
            value: getDisplayValue(row.adjustmentTypeName),
            format: formatLabel,
          },
          {
            label: 'Batch Type',
            value: getDisplayValue(row.batchType),
            format: formatLabel,
          },
        ]}
      />

      {/* ── Quantity Snapshot ────────────────────────────────────── */}
      <DetailsSection
        sectionTitle="Quantity Snapshot"
        fields={[
          {
            label: 'Previous Quantity',
            value: row.previousQuantity.toLocaleString(),
          },
          {
            label: 'Quantity Change',
            value:
              row.quantityChange > 0
                ? `+${row.quantityChange.toLocaleString()}`
                : row.quantityChange.toLocaleString(),
          },
          {
            label: 'New Quantity',
            value: row.newQuantity.toLocaleString(),
          },
          {
            label: 'Status',
            value: row.status?.name ?? null,
            format: formatLabel,
          },
        ]}
      />

      {/* ── Source Reference ─────────────────────────────────────── */}
      <DetailsSection
        sectionTitle="Source Reference"
        fields={[
          {
            label: 'Reference Type',
            value: getDisplayValue(row.referenceType),
            format: formatLabel,
          },
          {
            label: 'Reference ID',
            value: getDisplayValue(row.referenceId),
          },
        ]}
      />

      {/* ── Product Context ──────────────────────────────────────── */}
      {hasProductContext && (
        <DetailsSection
          sectionTitle="Product Context"
          fields={[
            {
              label: 'Product',
              value: getDisplayValue(row.productName),
            },
            {
              label: 'SKU',
              value: getDisplayValue(row.sku),
            },
            {
              label: 'Lot Number',
              value: getDisplayValue(row.productLotNumber),
            },
          ]}
        />
      )}

      {/* ── Packaging Material Context ───────────────────────────── */}
      {hasPackagingContext && (
        <DetailsSection
          sectionTitle="Packaging Material Context"
          fields={[
            {
              label: 'Packaging Material',
              value: getDisplayValue(row.packagingDisplayName),
            },
            {
              label: 'Material Code',
              value: getDisplayValue(row.packagingMaterialCode),
            },
            {
              label: 'Lot Number',
              value: getDisplayValue(row.packagingLotNumber),
            },
          ]}
        />
      )}

      {/* ── Comments ─────────────────────────────────────────────── */}
      <DetailsSection
        sectionTitle="Comments"
        fields={[
          {
            label: 'Comments',
            value: getDisplayValue(row.comments),
          },
        ]}
      />

      {/* ── Metadata ─────────────────────────────────────────────── */}
      {metadataText && (
        <Box mt={2}>
          <CustomTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Metadata
          </CustomTypography>

          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.8125rem',
              maxHeight: 260,
              overflow: 'auto',
            }}
          >
            {metadataText}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WarehouseInventoryActivityLogExpandedContent;
