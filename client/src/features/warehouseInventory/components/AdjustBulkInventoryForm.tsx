import type { FC } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import DetailsSection from '@components/common/DetailsSection';
import MultiItemForm, {
  type MultiItemFieldConfig,
} from '@components/common/MultiItemForm';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import LotAdjustmentTypeDropdown from '@features/lookup/components/LotAdjustmentTypeDropdown';
import type {
  InventoryAdjustmentBulkContext,
  InventoryAdjustmentFormData,
} from '@features/inventoryShared/types/InventorySharedType';
import type { AdjustmentTypeOption } from '@features/lookup/state';

interface AdjustBulkInventoryFormProps {
  initialQuantities: number[];
  adjustmentTypeOptions: AdjustmentTypeOption[];
  onSubmit: (formData: InventoryAdjustmentFormData[]) => void;
  contextData: InventoryAdjustmentBulkContext;
  dropdownLoading: boolean;
  dropdownError: string;
  onRefresh: () => void;
  loading?: boolean;
}

const AdjustBulkInventoryForm: FC<AdjustBulkInventoryFormProps> = ({
  initialQuantities,
  adjustmentTypeOptions,
  onSubmit,
  contextData,
  dropdownLoading,
  dropdownError,
  onRefresh,
  loading,
}) => {
  if (!contextData || contextData.length === 0) {
    return <Alert severity="warning">No inventory records selected</Alert>;
  }

  const fields: MultiItemFieldConfig[] = [
    {
      id: 'adjustment_type_id',
      label: 'Adjustment Type',
      type: 'custom',
      required: true,
      group: 'adjustment',
      component: ({ value, onChange }) => (
        <LotAdjustmentTypeDropdown
          value={value}
          onChange={onChange}
          lotAdjustmentTypeOptions={adjustmentTypeOptions}
          lotAdjustmentTypeLoading={dropdownLoading}
          lotAdjustmentTypeError={dropdownError}
          onRefresh={onRefresh}
        />
      ),
    },
    {
      id: 'newQuantity',
      label: 'New Quantity',
      type: 'number',
      required: true,
      group: 'adjustment',
      validation: (value) =>
        value === undefined || value === ''
          ? 'Required'
          : value < 0
            ? 'Must be 0 or greater'
            : undefined,
      placeholder: 'Enter adjusted quantity',
    },
    {
      id: 'note',
      label: 'Note (Optional)',
      type: 'textarea',
      required: false,
      placeholder: 'Reason for adjustment (optional)',
    },
  ];

  const defaultValues = contextData.map((record, index) => ({
    id: uuidv4(),
    newQuantity: initialQuantities[index],
    adjustment_type_id: '',
    note: '',
    recordId: record.id,
    _meta: record,
  }));

  return (
    <Stack spacing={3}>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Box mt={2}>
          <MultiItemForm
            getItemTitle={(index, item) =>
              item._meta?.displayName
                ? `Item Name: ${item._meta.displayName}`
                : `Item ${index + 1}`
            }
            fields={fields}
            defaultValues={defaultValues}
            onSubmit={(items) => {
              onSubmit(items as InventoryAdjustmentFormData[]);
            }}
            loading={loading}
            renderBeforeFields={(item, index) => {
              const record = item._meta || contextData[index];
              return (
                <DetailsSection
                  fields={[
                    { label: 'Warehouse', value: record.warehouseName },
                    { label: 'Location', value: record.locationName },
                    {
                      label: 'Type',
                      value: record.batchType,
                      format: formatLabel,
                    },
                    { label: 'Lot Number', value: record.lotNumber },
                    {
                      label: 'Expiry Date',
                      value: record.expiryDate,
                      format: formatDate,
                    },
                    { label: 'Warehouse Qty', value: record.warehouseQuantity },
                    { label: 'Location Qty', value: record.locationQuantity },
                    {
                      label: 'Status',
                      value: record.status,
                      format: formatLabel,
                    },
                  ]}
                />
              );
            }}
          />
        </Box>
      </Paper>
    </Stack>
  );
};

export default AdjustBulkInventoryForm;
