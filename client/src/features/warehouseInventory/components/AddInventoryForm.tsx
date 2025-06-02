import { type ChangeEvent, type Dispatch, type FC, type SetStateAction, useState } from 'react';
import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import BatchRegistryDropdown from '@features/dropdown/components/BatchRegistryDropdown';
import CustomDatePicker from '@components/common/CustomDatePicker';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import type { GetBatchRegistryDropdownParams } from '@features/dropdown/state';

interface AddInventoryFormProps {
  onSubmit: (formData: Record<string, any>) => void;
  loading?: boolean;
  dropdownOptions: { value: string; label: string }[];
  selectedBatch: { id: string; type: string } | null;
  setSelectedBatch: (value: { id: string; type: string } | null) => void;
  batchDropdownParams: GetBatchRegistryDropdownParams;
  setBatchDropdownParams: Dispatch<SetStateAction<GetBatchRegistryDropdownParams>>;
  fetchDropdown: (params: GetBatchRegistryDropdownParams) => void;
  hasMore: boolean;
  pagination?: { limit: number; offset: number };
  dropdownLoading?: boolean;
  dropdownError?: string | null;
}

const AddInventoryForm: FC<AddInventoryFormProps> = ({
                                                       onSubmit,
                                                       loading,
                                                       dropdownOptions,
                                                       selectedBatch,
                                                       setSelectedBatch,
                                                       batchDropdownParams,
                                                       setBatchDropdownParams,
                                                       fetchDropdown,
                                                       hasMore,
                                                       pagination,
                                                       dropdownLoading,
                                                       dropdownError,
                                                     }) => {
  const [batchType, setBatchType] = useState<'product' | 'packaging_material' | 'all'>('all');
  
  const handleBatchTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'product' | 'packaging_material' | 'all';
    setBatchType(value);
    setBatchDropdownParams((prev: GetBatchRegistryDropdownParams) => ({
      ...prev,
      batchType: value === 'all' ? undefined : value,
    }));
  };
  
  const fields: FieldConfig[] = [
    {
      id: 'batch_id',
      label: 'Batch',
      type: 'custom',
      required: true,
      customRender: ({ onChange }) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Batch Type</FormLabel>
              <RadioGroup
                row
                name="batchType"
                value={batchType}
                onChange={handleBatchTypeChange}
              >
                <FormControlLabel value="all" control={<Radio />} label="All" />
                <FormControlLabel value="product" control={<Radio />} label="Product" />
                <FormControlLabel value="packaging_material" control={<Radio />} label="Packaging" />
              </RadioGroup>
            </FormControl>
          </Box>
          
          <BatchRegistryDropdown
            value={selectedBatch ? `${selectedBatch.id}::${selectedBatch.type}` : null}
            options={dropdownOptions}
            onChange={(val) => {
              if (!val || !val.includes('::')) {
                setSelectedBatch(null);
                return;
              }
              const [id, type] = val.split('::');
              if (!id || !type) {
                setSelectedBatch(null);
                return;
              }
              setSelectedBatch({ id, type });
              onChange?.(`${id}::${type}`);
            }}
            loading={dropdownLoading}
            error={dropdownError}
            hasMore={hasMore}
            pagination={pagination}
            fetchParams={batchDropdownParams}
            setFetchParams={setBatchDropdownParams}
            onRefresh={fetchDropdown}
          />
        </Box>
      ),
    },
    {
      id: 'warehouse_id',
      label: 'Warehouse',
      type: 'text',
      required: true,
    },
    {
      id: 'location_id',
      label: 'Location',
      type: 'text',
      required: true,
    },
    {
      id: 'quantity',
      label: 'Quantity',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      id: 'inbound_date',
      label: 'Inbound Date',
      type: 'custom',
      customRender: ({ value, onChange }) => (
        <CustomDatePicker
          label="Inbound Date"
          value={value && !isNaN(Date.parse(value)) ? new Date(value) : null}
          onChange={(date: Date | null) => {
            const isoString = date ? date.toISOString() : ''; // convert Date back to string
            onChange?.(isoString);
          }}
        />
      )
    },
    {
      id: 'comments',
      label: 'Comments',
      type: 'textarea',
    },
  ];
  
  return (
    <CustomForm
      fields={fields}
      onSubmit={onSubmit}
      submitButtonLabel={loading ? 'Saving...' : 'Save'}
      showSubmitButton
    >
    </CustomForm>
  );
};

export default AddInventoryForm;
