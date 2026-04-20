import { type FC } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import DetailsSection from '@components/common/DetailsSection';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory/state/warehouseInventoryTypes';

interface WarehouseInventoryExpandedContentProps {
  row: FlattenedWarehouseInventory;
  canAdjust?: boolean;
  canUpdateStatus?: boolean;
  onAdjustQuantity?: (row: FlattenedWarehouseInventory) => void;
  onUpdateStatus?: (row: FlattenedWarehouseInventory) => void;
}

const WarehouseInventoryExpandedContent: FC<WarehouseInventoryExpandedContentProps> = ({
                                                                                         row,
                                                                                         canAdjust = false,
                                                                                         canUpdateStatus = false,
                                                                                         onAdjustQuantity,
                                                                                         onUpdateStatus,
                                                                                       }) => {
  const isProduct = row.batchType === 'product';
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={2}
      >
        <CustomTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Inventory Details
        </CustomTypography>
        
        {(canAdjust || canUpdateStatus) && (
          <Stack direction="row" spacing={1}>
            {canAdjust && (
              <CustomButton
                size="small"
                variant="outlined"
                onClick={() => onAdjustQuantity?.(row)}
              >
                Adjust Quantity
              </CustomButton>
            )}
            {canUpdateStatus && (
              <CustomButton
                size="small"
                variant="outlined"
                onClick={() => onUpdateStatus?.(row)}
              >
                Update Status
              </CustomButton>
            )}
          </Stack>
        )}
      </Box>
      
      {/* ── Quantities ─────────────────────────────────────────────── */}
      <DetailsSection
        sectionTitle="Quantities"
        fields={[
          { label: 'On Hand',           value: row.warehouseQuantity.toLocaleString() },
          { label: 'Reserved',          value: row.reservedQuantity.toLocaleString() },
          { label: 'Available',         value: row.availableQuantity.toLocaleString() },
          { label: 'Warehouse Fee',     value: row.warehouseFee != null ? `$${row.warehouseFee}` : null },
        ]}
      />
      
      {/* ── Product fields ─────────────────────────────────────────── */}
      {isProduct && (
        <DetailsSection
          sectionTitle="Product"
          fields={[
            { label: 'Product',        value: row.productName ?? null },
            { label: 'Brand',          value: row.brand ?? null, format: formatLabel },
            { label: 'SKU',            value: row.sku ?? null },
            { label: 'Barcode',        value: row.barcode ?? null },
            { label: 'Size',           value: row.sizeLabel ?? null },
            { label: 'Country',        value: row.countryCode ?? null },
            { label: 'Market Region',  value: row.marketRegion ?? null, format: formatLabel },
            { label: 'Lot Number',     value: row.lotNumber ?? null },
            { label: 'Manufacturer',   value: row.manufacturerName ?? null, format: formatLabel },
          ]}
        />
      )}
      
      {/* ── Packaging fields ───────────────────────────────────────── */}
      {!isProduct && (
        <DetailsSection
          sectionTitle="Packaging Material"
          fields={[
            { label: 'Material Code', value: row.materialCode ?? null },
            { label: 'Lot Number',    value: row.packagingLotNumber ?? null },
            { label: 'Supplier',      value: row.supplierName ?? null, format: formatLabel },
          ]}
        />
      )}
      
      {/* ── Movement & status ──────────────────────────────────────── */}
      <DetailsSection
        sectionTitle="Movement & Status"
        fields={[
          { label: 'Status',          value: row.statusName, format: formatLabel },
          { label: 'Status Date',     value: row.statusDate, format: formatDateTime },
          { label: 'Inbound Date',    value: row.inboundDate, format: formatDate },
          { label: 'Outbound Date',   value: row.outboundDate, format: formatDate },
          { label: 'Last Movement',   value: row.lastMovementAt, format: formatDateTime },
        ]}
      />
    </Box>
  );
};

export default WarehouseInventoryExpandedContent;
