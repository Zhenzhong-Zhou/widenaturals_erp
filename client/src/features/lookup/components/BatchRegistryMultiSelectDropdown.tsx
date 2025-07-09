import type { Dispatch, FC, SetStateAction } from 'react';
import type { BatchLookupOption, GetBatchRegistryLookupParams, LookupPaginationMeta } from '@features/lookup/state';
import MultiSelectDropdown, { type MultiSelectOption } from '@components/common/MultiSelectDropdown';

interface BatchRegistryMultiSelectDropdownProps {
  label?: string;
  batchLookupOptions: BatchLookupOption[];
  selectedOptions: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  batchLookupParams: GetBatchRegistryLookupParams;
  fetchBatchLookup: (params: GetBatchRegistryLookupParams) => void;
  setFetchParams: Dispatch<SetStateAction<GetBatchRegistryLookupParams>>;
  batchLookupMeta: LookupPaginationMeta;
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
                                                                                       batchLookupMeta,
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
      paginationMeta={batchLookupMeta}
      sx={sx}
      placeholder={placeholder}
    />
  );
};

export default BatchRegistryMultiSelectDropdown;
