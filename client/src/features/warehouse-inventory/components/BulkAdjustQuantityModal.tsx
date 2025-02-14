import { FC, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { CustomButton, CustomModal, Typography } from '@components/index.ts';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
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
  onSubmit: (
    data: {
      warehouse_inventory_id: string;
      adjustment_type_id: string;
      adjusted_quantity: number;
      comments: string;
    }[]
  ) => void;
}

type AdjustmentFormData = {
  adjustments: {
    warehouseInventoryLotId: string;
    productName: string;
    lotNumber: string;
    currentQuantity: number;
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

  const { fields, remove } = useFieldArray({
    control,
    name: 'adjustments',
  });

  // Fetch lot adjustment types
  const { types, loading } = useLotAdjustmentTypes();

  // Reset form when selectedLots change
  useEffect(() => {
    reset({
      adjustments: selectedLots.map((lot) => ({
        warehouseInventoryLotId: lot.warehouseInventoryLotId,
        productName: lot.productName,
        lotNumber: lot.lotNumber,
        currentQuantity: lot.currentQuantity,
        adjustedQuantity: 0,
        adjustmentType: '',
        comment: '',
      })),
    });
  }, [selectedLots, reset]);

  // Remove specific lot by ID
  const handleRemove = (warehouseInventoryLotId: string) => {
    const indexToRemove = fields.findIndex(
      (lot) => lot.warehouseInventoryLotId === warehouseInventoryLotId
    );
    if (indexToRemove !== -1) {
      remove(indexToRemove);
    }
  };

  // Handle form submission
  const handleFormSubmit = handleSubmit((formData) => {
    if (!Array.isArray(formData.adjustments)) {
      console.error('formData.adjustments is not an array', formData);
      return;
    }

    // Remove unchanged adjustments and empty adjustment types
    const filteredAdjustments = formData.adjustments.filter(
      (adjustment) =>
        adjustment.adjustedQuantity !== 0 && adjustment.adjustmentType !== ''
    );

    if (filteredAdjustments.length === 0) {
      console.warn('No changes detected, skipping submission.');
      return;
    }

    // Convert camelCase fields to snake_case for backend submission
    const backendFormattedData = filteredAdjustments.map((adjustment) => ({
      warehouse_inventory_id: adjustment.warehouseInventoryLotId,
      adjustment_type_id: adjustment.adjustmentType,
      adjusted_quantity: Number(adjustment.adjustedQuantity) || 0,
      comments: adjustment.comment || '',
    }));

    onSubmit(backendFormattedData);
  });

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Bulk Adjust Lot Quantities</Typography>
          {/* Close Button */}
          <IconButton onClick={onClose} color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>
      }
      sx={{
        width: 'auto',
        minWidth: '60vw',
        maxWidth: '90vw',
        height: 'auto',
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      <Box sx={{ p: 2 }} component="form" onSubmit={handleFormSubmit}>
        <Grid container spacing={2} justifyContent="center">
          {fields.map((lot, index) => (
            <Grid
              container
              spacing={{ xs: 2, md: 3 }}
              columns={{ xs: 2, sm: 8, md: 12 }}
              key={lot.id}
            >
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '280px',
                  flexGrow: 1, // Ensures consistency
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Title + Delete Button */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {lot.productName}
                    </Typography>
                    {/* Remove Button for Each Lot */}
                    <IconButton
                      onClick={() => handleRemove(lot.warehouseInventoryLotId)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Lot Number: <strong>{lot.lotNumber}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Quantity: <strong>{lot.currentQuantity}</strong>
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Keep Forms Aligned */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Adjustment Amount Input */}
                    <Controller
                      name={`adjustments.${index}.adjustedQuantity`}
                      control={control}
                      defaultValue={0}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Adjustment Amount"
                          type="number"
                          fullWidth
                        />
                      )}
                    />

                    {/* Adjustment Type Select */}
                    <Controller
                      name={`adjustments.${index}.adjustmentType`}
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Adjustment Type"
                          fullWidth
                          disabled={loading}
                        >
                          {types.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              {capitalizeFirstLetter(type.name)}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />

                    {/* Comment Input */}
                    <Controller
                      name={`adjustments.${index}.comment`}
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Comment (Optional)"
                          fullWidth
                        />
                      )}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Single Submit Button for All Adjustments */}
        <Box mt={3} textAlign="center">
          <CustomButton type="submit" variant="contained" color="primary">
            Apply All Adjustments
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
};

export default BulkAdjustQuantityModal;
