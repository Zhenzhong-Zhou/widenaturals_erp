import { type FC } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import DetailsSection, { type DetailsSectionField } from '@components/common/DetailsSection';
import CustomTypography from '@components/common/CustomTypography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import type { InventoryRecordOutput } from '@features/inventoryShared/types/InventorySharedType';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

interface InventorySuccessDialogProps {
  open: boolean;
  onClose: () => void;
  message?: string;
  warehouse?: InventoryRecordOutput | InventoryRecordOutput[];
  location?: InventoryRecordOutput | InventoryRecordOutput[];
}

const InventorySuccessDialog: FC<InventorySuccessDialogProps> = ({
                                                                   open,
                                                                   onClose,
                                                                   message = 'Inventory submitted successfully.',
                                                                   warehouse,
                                                                   location,
                                                                 }) => {
  const transformFields = (data: InventoryRecordOutput): DetailsSectionField[] => [
    {
      label: 'Item Type',
      value: data.itemType,
      format: (value) => formatLabel(value),
    },
    { label: 'Name', value: data.name },
    { label: 'Lot Number', value: data.lotNumber },
    { label: 'Quantity', value: data.quantity },
    { label: 'Reserved', value: data.reserved },
    {
      label: 'Expiry Date',
      value: data.expiryDate ?? '',
      format: (value) => formatDate(value),
    },
  ];
  
  const warehouseList = Array.isArray(warehouse) ? warehouse : warehouse ? [warehouse] : [];
  const locationList = Array.isArray(location) ? location : location ? [location] : [];
  
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Adjustment Successful"
      confirmButtonText="Close"
      onConfirm={onClose}
      showCancelButton={false}
    >
      <Box sx={{ px: 5 }}>
        <CustomTypography variant="body1" sx={{ mb: 2 }}>
          {message}
        </CustomTypography>
        
        <Stack spacing={4}>
          {warehouseList.map((record, idx) => (
            <DetailsSection
              key={`warehouse-${idx}`}
              sx={{ mt: 1 }}
              sectionTitle={
                warehouseList.length > 1
                  ? `Warehouse Inventory #${idx + 1}`
                  : 'Warehouse Inventory'
              }
              fields={transformFields(record)}
            />
          ))}
          
          {warehouseList.length > 0 && locationList.length > 0 && <Divider />}
          
          {locationList.map((record, idx) => (
            <DetailsSection
              key={`location-${idx}`}
              sx={{ mt: 1 }}
              sectionTitle={
                locationList.length > 1
                  ? `Location Inventory #${idx + 1}`
                  : 'Location Inventory'
              }
              fields={transformFields(record)}
            />
          ))}
        </Stack>
      </Box>
    </CustomDialog>
  );
};

export default InventorySuccessDialog;
