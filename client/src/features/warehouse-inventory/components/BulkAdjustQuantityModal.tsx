import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CustomForm, CustomModal, Typography } from '@components/index.ts';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { useLotAdjustmentTypes } from '../../../hooks';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';

interface BulkAdjustQuantityModalProps {
  open: boolean;
  onClose: () => void;
  selectedLots: {
    warehouseInventoryLotId: string;
    productName: string;
    lotNumber: string;
    currentQuantity: number;
  }[];
  onSubmit: (data: {
    warehouse_inventory_id: string;
    adjustment_type_id: string;
    adjusted_quantity: number;
    comments: string;
  }[]) => void;
}

type AdjustmentFormData = {
  adjustments: {
    warehouseInventoryLotId: string;
    adjustedQuantity: number;
    adjustmentType: string;
    comment: string;
  }[];
};

const BulkAdjustQuantityModal: FC<BulkAdjustQuantityModalProps> = ({
                                                                     open,
                                                                     onClose,
                                                                     selectedLots,
                                                                     onSubmit,
                                                                   }) => {
  const { control, handleSubmit, reset } = useForm<AdjustmentFormData>({
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
  
  // Reset form when selectedLots change
  useEffect(() => {
    reset({
      adjustments: selectedLots.map((lot) => ({
        warehouseInventoryLotId: lot.warehouseInventoryLotId,
        adjustedQuantity: 0,
        adjustmentType: '',
        comment: '',
      })),
    });
  }, [selectedLots, reset]);
  
  const handleFormSubmit = () => handleSubmit((formData) => {
    if (!Array.isArray(formData.adjustments)) {
      console.error('formData.adjustments is not an array', formData);
      return;
    }
    
    // Convert camelCase fields to snake_case for backend submission
    const backendFormattedData = formData.adjustments.map((adjustment) => ({
      warehouse_inventory_id: adjustment.warehouseInventoryLotId,
      adjustment_type_id: adjustment.adjustmentType,
      adjusted_quantity: Number(adjustment.adjustedQuantity) || 0,
      comments: adjustment.comment || '',
    }));
    onSubmit(backendFormattedData);
  })();
  
  return (
    <CustomModal open={open} onClose={onClose} title="Bulk Adjust Lot Quantities">
      <Box sx={{ maxHeight: '60vh', overflowY: 'auto', p: 2 }}>
        <Stack spacing={3}>
          {selectedLots.map((lot, index) => (
            <Card key={lot.warehouseInventoryLotId} variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  {lot.productName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lot Number: <strong>{lot.lotNumber}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Quantity: <strong>{lot.currentQuantity}</strong>
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <CustomForm
                  control={control}
                  fields={[
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
                      options: types.map((type) => ({
                        value: type.id,
                        label: capitalizeFirstLetter(type.name),
                      })),
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
                  onSubmit={handleFormSubmit}
                  submitButtonLabel="Apply Adjustments"
                  disabled={loading}
                />
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </CustomModal>
  );
};

export default BulkAdjustQuantityModal;
