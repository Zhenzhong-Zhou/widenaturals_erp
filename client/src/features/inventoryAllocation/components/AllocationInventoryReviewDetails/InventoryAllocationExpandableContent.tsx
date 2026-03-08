import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import {
  CustomTypography,
  DetailsSection
} from '@components/index';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedAllocationReviewItem } from '@features/inventoryAllocation';

interface Props {
  row: FlattenedAllocationReviewItem;
}

const InventoryAllocationExpandableContent: FC<Props> = ({ row }) => {
  const {
    allocationId,
    batchType,
    barcode,
    createdAt,
    createdByName,
    updatedAt,
    updatedByName,
    manufactureDate,
    warehouseInventoryList,
  } = row;
  
  const isAllocated = Boolean(allocationId);
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Inventory Allocation Details
      </CustomTypography>
      
      {/* Fallback message for unallocated items */}
      {!isAllocated && (
        <Box sx={{ mb: 2 }}>
          <CustomTypography variant="body2" color="text.secondary">
            This item has not yet been allocated to inventory.
          </CustomTypography>
        </Box>
      )}
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <DetailsSection
            fields={[
              { label: 'Batch Type', value: batchType, format: formatLabel },
              { label: 'Barcode', value: barcode },
            ]}
          />
        </Grid>
        
        {/* Allocation audit info */}
        {isAllocated && (
          <Grid size={{ xs: 12, md: 6 }}>
            <DetailsSection
              fields={[
                { label: 'Created At', value: createdAt, format: formatDate },
                {
                  label: 'Created By',
                  value: createdByName,
                  format: formatLabel,
                },
                { label: 'Updated At', value: updatedAt, format: formatDate },
                {
                  label: 'Updated By',
                  value: updatedByName,
                  format: formatLabel,
                },
              ]}
            />
          </Grid>
        )}
        
        {/* Manufacture date */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsSection
            fields={[
              {
                label: 'Manufacture Date',
                value: manufactureDate,
                format: formatDate,
              },
            ]}
          />
        </Grid>
        
        {/* Warehouse inventory */}
        <Grid size={{ xs: 12 }}>
          {warehouseInventoryList?.length > 0 ? (
            warehouseInventoryList.map((w, idx) => {
              const isMultipleWarehouses = warehouseInventoryList.length > 1;
              
              const fields = isMultipleWarehouses
                ? [
                  {
                    label: 'Inbound Date',
                    value: w.inboundDate,
                    format: formatDate,
                  },
                  {
                    label: 'Status Date',
                    value: w.statusDate,
                    format: formatDate,
                  },
                  { label: 'Status', value: w.statusName },
                  {
                    label: 'Qty',
                    value: w.warehouseQuantity?.toString() ?? '—',
                  },
                  {
                    label: 'Reserved',
                    value: w.reservedQuantity?.toString() ?? '—',
                  },
                ]
                : [
                  {
                    label: 'Inbound Date',
                    value: w.inboundDate,
                    format: formatDate,
                  },
                  {
                    label: 'Status Date',
                    value: w.statusDate,
                    format: formatDate,
                  },
                ];
              
              return (
                <Box key={w.id ?? `warehouse-${idx}`} sx={{ mb: 2 }}>
                  <CustomTypography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Warehouse Name: {w.warehouseName ?? `Warehouse ${idx + 1}`}
                  </CustomTypography>
                  
                  <DetailsSection fields={fields} />
                </Box>
              );
            })
          ) : (
            <DetailsSection
              fields={[{ label: 'Warehouse Inventory', value: 'No warehouse data' }]}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryAllocationExpandableContent;
