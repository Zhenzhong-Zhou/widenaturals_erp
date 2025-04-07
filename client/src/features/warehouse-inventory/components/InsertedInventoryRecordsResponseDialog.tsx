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

const InventoryRecordsResponseDialog: FC<InventoryRecordsDialogProps> = ({
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
    data: insertedDataResponse.data.map((warehouse) => ({
      ...warehouse,
      inventoryRecords: warehouse.inventoryRecords.map((record) => ({
        ...record,
        expiryDate: record.expiryDate ? formatDateTime(record.expiryDate) : 'N/A',
        manufactureDate: record.manufactureDate
          ? formatDateTime(record.manufactureDate)
          : 'N/A',
        inboundDate: formatDateTime(record.inboundDate),
        audit: {
          ...record.audit,
          createdAt: formatDateTime(record.audit.createdAt),
          updatedAt: formatDateTime(record.audit.updatedAt),
        },
      })),
    })),
  };
  
  return (
    <div>
      <CustomDialog
        open={open}
        onClose={() => onClose(false)}
        title="Inserted Inventory Records"
      >
        {formattedData.data.map((warehouse) => (
          <Box key={warehouse.warehouseId} sx={{ marginBottom: 2 }}>
            <Typography variant="h6">{warehouse.warehouseName}</Typography>
            <Typography variant="body2">
              Total Records: {warehouse.totalRecords}
            </Typography>
            
            {warehouse.inventoryRecords.map((record) => (
              <Box key={record.warehouseLotId} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {record.productName} (Lot: {record.lotNumber})
                </Typography>
                <MetadataSection data={record} />
              </Box>
            ))}
          </Box>
        ))}
      </CustomDialog>
    </div>
  );
};

export default InventoryRecordsResponseDialog;
