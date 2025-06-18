import type { Dispatch, FC, SetStateAction } from 'react';
import type { BatchLookupOption, GetBatchRegistryLookupParams } from '@features/lookup/state';
import MultiSelectDropdown, { type MultiSelectOption } from '@components/common/MultiSelectDropdown';

interface BatchRegistryMultiSelectDropdownProps {
  label?: string;
  batchLookupOptions: BatchLookupOption[];
  selectedOptions: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
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
                                                                                       selectedOptions,
                                                                                       onChange,
                                                                                       loading,
                                                                                       disabled,
                                                                                       error,
                                                                                       helperText,
                                                                                       hasMore,
                                                                                       pagination,
                                                                                       sx,
                                                                                       placeholder = 'Choose batches...',
                                                                                     }) => {
  return (
    <MultiSelectDropdown
      label={label}
      options={batchLookupOptions}
      selectedOptions={selectedOptions}
      onChange={onChange}
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
