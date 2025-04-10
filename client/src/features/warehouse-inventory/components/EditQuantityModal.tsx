import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import CustomModal from '@components/common/CustomModal';
import CustomForm from '@components/common/CustomForm';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography';
import { formatLabel } from '@utils/textUtils';
import { LotAdjustmentType } from '@features/warehouse-inventory/state';
import useLotAdjustmentTypes from '@hooks/useLotAdjustmentTypes';

interface EditQuantityModalProps {
  open: boolean;
  onClose: () => void;
  warehouseInventoryLotId: string;
  itemName: string;
  lotNumber: string;
  currentQuantity: number;
  onSubmit: (data: {
    warehouseInventoryLotId: string;
    adjustedQuantity: number;
    adjustmentType: string;
    comment: string;
  }) => void;
}

const EditQuantityModal: FC<EditQuantityModalProps> = ({
  open,
  onClose,
  warehouseInventoryLotId,
  itemName,
  lotNumber,
  currentQuantity,
  onSubmit,
}) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      adjustedQuantity: 0,
      adjustmentType: '',
      comment: '',
    },
  });

  // Fetch lot adjustment types using the hook
  const { types, loading } = useLotAdjustmentTypes();

  // Reset form when `warehouseInventoryId` or `currentQuantity` changes
  useEffect(() => {
    reset({
      adjustedQuantity: 0,
      adjustmentType: '',
      comment: '',
    });
  }, [warehouseInventoryLotId, currentQuantity, reset]);

  const handleFormSubmit = () =>
    handleSubmit((formData) => {
      onSubmit({
        warehouseInventoryLotId,
        adjustedQuantity: Number(formData.adjustedQuantity),
        adjustmentType: formData.adjustmentType,
        comment: formData.comment || '',
      });
    })();

  return (
    <CustomModal open={open} onClose={onClose} title="Edit Lot Quantity">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {itemName}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Lot Number: <strong>{lotNumber}</strong>
        </Typography>
      </Box>

      <CustomForm
        control={control}
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
            helperText:
              'Use negative (-) for reducing stock, positive (+) for adding stock.',
          },
          {
            id: 'adjustmentType',
            label: 'Adjustment Type',
            type: 'select',
            options: types.map((type: LotAdjustmentType) => ({
              value: type.id,
              label: formatLabel(type.name),
            })),
            required: true,
            disabled: loading,
          },
          {
            id: 'comment',
            label: 'Comment (Optional)',
            type: 'textarea', // Change type to textarea
            required: false,
            rows: 4, // Increase number of rows for more space
            placeholder: 'Enter your comments here...', // Provide better UX
          },
        ]}
        onSubmit={handleFormSubmit}
        submitButtonLabel="Update"
        disabled={loading}
      />
    </CustomModal>
  );
};

export default EditQuantityModal;
