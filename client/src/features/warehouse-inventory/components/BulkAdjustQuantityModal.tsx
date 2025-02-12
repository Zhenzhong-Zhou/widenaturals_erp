import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { CustomForm, CustomModal, Typography } from '@components/index.ts';
import Box from '@mui/material/Box';
import { useLotAdjustmentTypes } from '../../../hooks';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';

interface BulkAdjustQuantityModalProps {
  open: boolean;
  onClose: () => void;
  selectedLots: { warehouseInventoryLotId: string; productName: string; lotNumber: string; currentQuantity: number }[];
  onSubmit: (data: { adjustments: { warehouseInventoryLotId: string; adjustedQuantity: number; adjustmentType: string; comment: string }[] }) => void;
}

const BulkAdjustQuantityModal: FC<BulkAdjustQuantityModalProps> = ({
                                                                     open,
                                                                     onClose,
                                                                     selectedLots,
                                                                     onSubmit,
                                                                   }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      adjustments: selectedLots.map((lot) => ({
        warehouseInventoryLotId: lot.warehouseInventoryLotId,
        adjustedQuantity: 0,
        adjustmentType: '',
        comment: '',
      })),
    },
  });
  
  // Fetch lot adjustment types
  const { types, loading } = useLotAdjustmentTypes();
  
  return (
    <CustomModal open={open} onClose={onClose} title="Bulk Adjust Lot Quantities">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {selectedLots.map((lot, index) => (
          <Box key={lot.warehouseInventoryLotId} sx={{ borderBottom: '1px solid #ddd', pb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {lot.productName}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Lot Number: <strong>{lot.lotNumber}</strong>
            </Typography>
            
            <CustomForm
              fields={[
                {
                  id: `adjustments.${index}.currentQuantity`,
                  label: 'Current Quantity',
                  type: 'text',
                  required: false,
                  defaultValue: lot.currentQuantity,
                  disabled: true,
                },
                {
                  id: `adjustments.${index}.adjustedQuantity`,
                  label: 'Adjustment Amount',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  helperText: 'Use negative (-) for reducing stock, positive (+) for adding stock.',
                },
                {
                  id: `adjustments.${index}.adjustmentType`,
                  label: 'Adjustment Type',
                  type: 'select',
                  options: types.map((type) => ({ value: type.id, label: capitalizeFirstLetter(type.name) })),
                  required: true,
                  disabled: loading,
                },
                {
                  id: `adjustments.${index}.comment`,
                  label: 'Comment (Optional)',
                  type: 'text',
                  required: false,
                },
              ]}
            />
          </Box>
        ))}
      </Box>
      
      <CustomForm
        onSubmit={(formData) => onSubmit({ adjustments: formData.adjustments })}
        submitButtonLabel="Apply Adjustments"
      />
    </CustomModal>
  );
};

export default BulkAdjustQuantityModal;
