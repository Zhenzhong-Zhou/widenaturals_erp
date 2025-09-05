import type { Dispatch, FC, SetStateAction } from 'react';
import type {
  BatchLookupOption,
  GetBatchRegistryLookupParams,
  LookupPaginationMeta,
} from '@features/lookup/state';
import MultiSelectDropdown, {
  type MultiSelectOption,
} from '@components/common/MultiSelectDropdown';

interface BatchRegistryMultiSelectDropdownProps {
  label?: string;
  batchLookupOptions: BatchLookupOption[];
  selectedOptions: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
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
                                                                                       placeholder = 'Choose batches...',
                                                                                       batchLookupOptions,
                                                                                       selectedOptions,
                                                                                       onChange,
                                                                                       batchLookupMeta,
                                                                                       batchLookupLoading,
                                                                                       disabled,
                                                                                       error,
                                                                                       helperText,
                                                                                       sx,
                                                                                       setFetchParams,
                                                                                       batchLookupError,
                                                                                     }) => {
  const handleFetchMore = (next?: { limit?: number; offset?: number }) => {
    if (!next) return;
    setFetchParams((prev) => ({
      ...prev,
      offset: next.offset ?? prev.offset,
      limit: next.limit ?? prev.limit,
    }));
  };
  
  return (
    <MultiSelectDropdown
      label={label}
      options={batchLookupOptions}
      selectedOptions={selectedOptions}
      onChange={onChange}
      loading={batchLookupLoading}
      disabled={disabled}
      error={error || batchLookupError}
      helperText={helperText}
      paginationMeta={{
        ...batchLookupMeta,
        onFetchMore: handleFetchMore,
      }}
      placeholder={placeholder}
      sx={sx}
    />
  );
};

export default BatchRegistryMultiSelectDropdown;
