import { FC } from 'react';
import Box from '@mui/material/Box';
import {
  CustomDialog,
  MetadataSection,
  Typography,
} from '@components/index.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { WarehouseInventoryInsertResponse } from '../state/warehouseInventoryTypes.ts';

interface InventoryRecordsDialogProps {
  insertedDataResponse?: WarehouseInventoryInsertResponse | null;
  open: boolean;
  onClose: (open: boolean) => void;
}

const InventoryRecordsDialog: FC<InventoryRecordsDialogProps> = ({
  insertedDataResponse,
  open,
  onClose,
}) => {
  if (!insertedDataResponse?.data || insertedDataResponse.data.length === 0) {
    return <Box />;
  }

  // Properly type destructuring variables
  const formattedData = {
    ...insertedDataResponse,
    data: insertedDataResponse.data.map(
      ({ warehouse_id, inventory_records, ...warehouseData }) => ({
        ...warehouseData, // Keep other warehouse details
        inventory_records: inventory_records.map(
          ({
            inventory_id,
            warehouse_lot_id,
            location_id,
            inventory_created_by,
            inventory_updated_by,
            inbound_date,
            inventory_created_at,
            inventory_updated_at,
            expiry_date,
            manufacture_date,
            ...recordData
          }) => ({
            ...recordData, // Keep other inventory details
            inventory_created_by,
            inventory_updated_by,
            inbound_date: formatDateTime(inbound_date),
            inventory_created_at: formatDateTime(inventory_created_at),
            inventory_updated_at: formatDateTime(inventory_updated_at),
            expiry_date: expiry_date ? formatDateTime(expiry_date) : 'N/A', // Handle null expiry date
            manufacture_date: manufacture_date
              ? formatDateTime(manufacture_date)
              : 'N/A', // Handle null manufacture date
          })
        ),
      })
    ),
  };

  return (
    <div>
      <CustomDialog
        open={open}
        onClose={() => onClose(false)}
        title="Inserted Inventory Records"
      >
        {formattedData.data.map((warehouse, index) => (
          <Box key={index} sx={{ marginBottom: 2 }}>
            <Typography variant="h6">{warehouse.warehouse_name}</Typography>
            <Typography variant="body2">
              Total Records: {warehouse.total_records}
            </Typography>

            <MetadataSection data={warehouse} />
          </Box>
        ))}
      </CustomDialog>
    </div>
  );
};

export default InventoryRecordsDialog;
