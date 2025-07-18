import type { FC } from 'react';
import CustomForm from '@components/common/CustomForm';
import type { FieldConfig } from '@components/common/CustomForm';
import Box from '@mui/material/Box';
import DetailsSection from '@components/common/DetailsSection';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils.ts';
import type {
  InventoryAdjustmentSingleContext,
  InventoryAdjustmentFormData,
} from '@features/inventoryShared/types/InventorySharedType';
import LotAdjustmentTypeDropdown from '@features/lookup/components/LotAdjustmentTypeDropdown';
import type { AdjustmentTypeOption } from '@features/lookup/state';

interface AdjustInventoryFormProps {
  initialQuantity: number;
  adjustmentTypeOptions: AdjustmentTypeOption[];
  onSubmit: (formData: InventoryAdjustmentFormData) => void;
  contextData: InventoryAdjustmentSingleContext;
  dropdownLoading: boolean;
  dropdownError: string;
  onRefresh: () => void;
  loading: boolean;
}

const AdjustInventoryForm: FC<AdjustInventoryFormProps> = ({
  initialQuantity,
  adjustmentTypeOptions,
  onSubmit,
  contextData,
  dropdownLoading,
  dropdownError,
  onRefresh,
}) => {
  const {
    batchType,
    warehouseName,
    locationName,
    displayName,
    lotNumber,
    expiryDate,
    warehouseQuantity,
    locationQuantity,
    status,
  } = contextData;

  const fields: FieldConfig[] = [
    {
      id: 'adjustment_type_id',
      label: 'Adjustment Type',
      type: 'custom',
      required: true,
      grid: { xs: 12, sm: 6 },
      customRender: ({ value, onChange }) =>
        onChange ? (
          <LotAdjustmentTypeDropdown
            value={value}
            onChange={onChange as (val: string) => void}
            lotAdjustmentTypeOptions={adjustmentTypeOptions}
            lotAdjustmentTypeLoading={dropdownLoading}
            lotAdjustmentTypeError={dropdownError}
            onRefresh={onRefresh}
          />
        ) : null,
    },
    {
      id: 'newQuantity',
      label: 'New Quantity',
      type: 'number',
      required: true,
      grid: { xs: 12, sm: 6 },
      min: 0,
      defaultValue: initialQuantity,
    },
    {
      id: 'note',
      label: 'Note (Optional)',
      type: 'textarea',
      rows: 3,
      required: false,
      grid: { xs: 12 },
      placeholder: 'Reason for adjustment (optional)',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        px: 4, // horizontal padding for small screens
        py: 4,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3,
          maxWidth: 720, // set a reasonable max width
          width: '100%',
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        {/* Details Section */}
        <Box sx={{ mb: 3 }}>
          <DetailsSection
            sectionTitle="Inventory Details"
            fields={[
              { label: 'Warehouse', value: warehouseName },
              { label: 'Location', value: locationName },
              { label: 'Item', value: displayName },
              {
                label: 'Type',
                value: batchType,
                format: (value) => formatLabel(value),
              },
              { label: 'Lot Number', value: lotNumber },
              {
                label: 'Expiry Date',
                value: expiryDate,
                format: (value) => formatDate(value),
              },
              { label: 'Warehouse Qty', value: warehouseQuantity },
              { label: 'Location Qty', value: locationQuantity },
              {
                label: 'Status',
                value: status,
                format: (value) => formatLabel(value),
              },
            ]}
          />
        </Box>

        {/* Divider for visual separation */}
        <Divider sx={{ mb: 3 }} />

        {/* Form Section */}
        <Stack spacing={2}>
          <CustomForm
            fields={fields}
            initialValues={{ newQuantity: initialQuantity }}
            onSubmit={(formData: Record<string, any>) => {
              onSubmit(formData as InventoryAdjustmentFormData);
            }}
            submitButtonLabel="Adjust Inventory"
            showSubmitButton
          />
        </Stack>
      </Paper>
    </Box>
  );
};

export default AdjustInventoryForm;
