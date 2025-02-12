import { FC, useEffect } from 'react';
import CustomModal from '@components/common/CustomModal';
import CustomForm from '@components/common/CustomForm';
import { useForm } from 'react-hook-form';
import { Typography } from '@components/index.ts';
import Box from '@mui/material/Box';
import { useLotAdjustmentTypes } from '../../../hooks';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';

interface EditQuantityModalProps {
  open: boolean;
  onClose: () => void;
  warehouseInventoryLotId: string;
  productName: string;
  lotNumber: string;
  currentQuantity: number;
  onSubmit: (data: { warehouseInventoryLotId: string; adjustedQuantity: number; adjustmentType: string; comment: string }) => void;
}

const EditQuantityModal: FC<EditQuantityModalProps> = ({
                                                         open,
                                                         onClose,
                                                         warehouseInventoryLotId,
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
  
  // Fetch lot adjustment types using the hook
  const { types, loading } = useLotAdjustmentTypes();
  
  // Reset form when `warehouseInventoryId` or `currentQuantity` changes
  useEffect(() => {
    reset({
      currentQuantity,
      adjustmentType: '',
      comment: '',
    });
  }, [warehouseInventoryLotId, currentQuantity, reset]);
  
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
            id: 'currentQuantity',
            label: 'Current Quantity',
            type: 'text',
            required: false,
            defaultValue: currentQuantity,
            disabled: true,
          },
          {
            id: 'adjustedQuantity',
            label: 'Adjustment Amount',
            type: 'number',
            required: true,
            defaultValue: 0,
            helperText: 'Use negative (-) for reducing stock, positive (+) for adding stock.',
          },
          {
            id: 'adjustmentType',
            label: 'Adjustment Type',
            type: 'select',
            options: types.map((type) => ({ value: type.id, label: capitalizeFirstLetter(type.name) })),
            required: true,
            disabled: loading,
          },
          {
            id: 'comment',
            label: 'Comment (Optional)',
            type: 'text',
            required: false,
          },
        ]}
        onSubmit={(formData) =>
          onSubmit({
            warehouseInventoryLotId,
            adjustedQuantity: Number(formData.adjustedQuantity),
            adjustmentType: formData.adjustmentType,
            comment: formData.comment || '',
          })
        }
        
        submitButtonLabel="Update"
      />
    </CustomModal>
  );
};

export default EditQuantityModal;
