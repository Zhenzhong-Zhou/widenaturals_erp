import type { Dispatch, FC, SetStateAction } from 'react';
import type { BatchLookupOption, GetBatchRegistryLookupParams } from '@features/lookup/state';
import MultiSelectDropdown, { type MultiSelectOption } from '@components/common/MultiSelectDropdown';

interface BatchRegistryMultiSelectDropdownProps {
  label?: string;
  batchLookupOptions: BatchLookupOption[];
  selectedBatches: { id: string; type: string }[];
  onSelectedBatchesChange: (value: { id: string; type: string }[]) => void;
  batchLookupParams: GetBatchRegistryLookupParams;
  fetchBatchLookup: (params: GetBatchRegistryLookupParams) => void;
  setFetchParams: Dispatch<SetStateAction<GetBatchRegistryLookupParams>>;
  hasMore: boolean;
  pagination?: { limit: number; offset: number };
  batchLookupLoading?: boolean;
  batchLookupError?: string | null;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  sx?: object;
  placeholder?: string;
}

const BatchRegistryMultiSelectDropdown: FC<BatchRegistryMultiSelectDropdownProps> = ({
                                                                                       label = 'Select Batches',
                                                                                       batchLookupOptions,
                                                                                       selectedBatches,
                                                                                       onSelectedBatchesChange,
                                                                                       loading,
                                                                                       disabled,
                                                                                       error,
                                                                                       helperText,
                                                                                       hasMore,
                                                                                       pagination,
                                                                                       sx,
                                                                                       placeholder = 'Choose batches...',
                                                                                     }) => {
  // Convert selectedBatches to dropdown-compatible format
  const mappedSelected: MultiSelectOption[] = batchLookupOptions.filter((opt) =>
    selectedBatches.some((b) => b.id === opt.value)
  );
  console.log(mappedSelected);
  // Handle selection change
  const handleChange = (selectedOptions: MultiSelectOption[]) => {
    const newSelected = selectedOptions.map((opt) => {
      const matched = batchLookupOptions.find((item) => item.value === opt.value);
      return {
        id: opt.value,
        type: matched?.type ?? 'product', // fallback
      };
    });
    onSelectedBatchesChange(newSelected);
  };
  
  return (
    <MultiSelectDropdown
      label={label}
      options={batchLookupOptions}
      selectedOptions={mappedSelected}
      onChange={handleChange}
      loading={loading}
      disabled={disabled}
      error={error}
      helperText={helperText}
      hasMore={hasMore}
      pagination={pagination}
      sx={sx}
      placeholder={placeholder}
    />
  );
};

export default BatchRegistryMultiSelectDropdown;
