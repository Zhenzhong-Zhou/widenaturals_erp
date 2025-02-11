import { FC, useEffect } from 'react';
import CustomModal from '@components/common/CustomModal';
import CustomForm from '@components/common/CustomForm';
import { useForm } from 'react-hook-form';
import { Typography } from '@components/index.ts';
import Box from '@mui/material/Box';

interface EditQuantityModalProps {
  open: boolean;
  onClose: () => void;
  warehouseInventoryId: string;
  productName: string;
  lotNumber: string;
  currentQuantity: number;
  onSubmit: (data: { warehouseInventoryId: string; quantity: number; adjustmentType: string; comment: string }) => void;
}

const EditQuantityModal: FC<EditQuantityModalProps> = ({
                                                         open,
                                                         onClose,
                                                         warehouseInventoryId,
                                                         productName,
                                                         lotNumber,
                                                         currentQuantity,
                                                         onSubmit,
                                                       }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      currentQuantity,
      adjustmentType: '',
      comment: '',
    },
  });
  
  // Reset form when `warehouseInventoryId` or `quantity` changes
  useEffect(() => {
    reset({
      currentQuantity,
      adjustmentType: '',
      comment: '',
    });
  }, [warehouseInventoryId, currentQuantity, reset]);
  
  return (
    <CustomModal open={open} onClose={onClose} title="Edit Lot Quantity">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {productName}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Lot Number: <strong>{lotNumber}</strong>
        </Typography>
      </Box>
      
      <CustomForm
        fields={[
          {
            id: 'quantity',
            label: 'New Quantity',
            type: 'text',
            required: true,
            defaultValue: currentQuantity,
          },
          {
            id: 'adjustmentType',
            label: 'Adjustment Type',
            type: 'select',
            options: [
              { value: 'manual_adjustment', label: 'Manual Adjustment' },
              { value: 'restock', label: 'Restock' },
              { value: 'damaged', label: 'Damaged' },
            ],
            required: true,
          },
          {
            id: 'comment',
            label: 'Comment',
            type: 'text',
          },
        ]}
        onSubmit={(formData) => onSubmit({ ...formData, warehouseInventoryId })}
        submitButtonLabel="Update"
      />
    </CustomModal>
  );
};

export default EditQuantityModal;
