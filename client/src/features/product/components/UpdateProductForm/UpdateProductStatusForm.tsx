import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import type {
  StatusLookupParams,
} from '@features/lookup/state';
import {
  createLookupParams,
  normalizeLookupParams,
} from '@features/lookup/utils/lookupUtils';
import {
  createProductStatusField
} from '@features/product/components/UpdateProductForm';
import {
  ProductStatusLookupController
} from '@features/product/components/UpdateProductForm/UpdateProductStatusDialog';
import useStatusSearchHandlers from '@features/lookup/hooks/useStatusSearchHandlers';
import { formatLabel } from '@utils/textUtils';

interface UpdateProductStatusFormProps {
  /** Whether the form is submitting */
  loading?: boolean;
  
  /** Handler invoked on form submit */
  onSubmit: (data: { statusId: string, statusLabel: string }) => void | Promise<void>;
  
  /** Product being updated (optional display) */
  productId: string;
  
  statusLookup: ProductStatusLookupController;
}

const UpdateProductStatusForm: FC<UpdateProductStatusFormProps> = ({
                                                                     loading,
                                                                     onSubmit,
                                                                     statusLookup,
                                                                   }) => {
  const {
    options: statusOptions,
    loading: statusLookupLoading,
    error: statusLookupError,
    meta: statusLookupMeta,
    fetch: fetchStatusOptions,
    reset: resetStatusLookup,
  } = statusLookup;
  
  const formattedStatusOptions = useMemo(
    () =>
      statusOptions.map((opt) => ({
        ...opt,
        label: formatLabel(opt.label),
      })),
    [statusOptions]
  );
  
  // --------------------------------------------------------
  // State: keyword input + pagination
  // --------------------------------------------------------
  const [inputValue, setInputValue] = useState('');
  const [fetchParams, setFetchParams] =
    useState(createLookupParams<StatusLookupParams>());
  
  // --------------------------------------------------------
  // Debounced lookup request
  // --------------------------------------------------------
  const { handleStatusSearch } = useStatusSearchHandlers({
    fetch: fetchStatusOptions,
  });
  
  /** Search input change (called by dropdown) */
  const handleSearchInput = (keyword: string) => {
    setInputValue(keyword);
    
    const updated = normalizeLookupParams({
      ...fetchParams,
      keyword,
      offset: 0,
    });
    
    setFetchParams(updated);
    handleStatusSearch(keyword); // debounced fetch
  };
  
  // --------------------------------------------------------
  // Reset lookup state on unmount
  // --------------------------------------------------------
  const handleReset = useCallback(() => {
    setInputValue('');
    const resetParams = createLookupParams<StatusLookupParams>();
    setFetchParams(resetParams);
    
    resetStatusLookup(); // reset lookup hook
    fetchStatusOptions(resetParams); // re-fetch initial list
  }, [resetStatusLookup, fetch]);
  
  useEffect(() => handleReset, []);
  
  // --------------------------------------------------------
  // Build form fields
  // --------------------------------------------------------
  const formFields = useMemo<FieldConfig[]>(
    () => [
      createProductStatusField({
        inputValue,
        setInputValue,
        fetchParams,
        setFetchParams,
        options: formattedStatusOptions,
        loading: statusLookupLoading,
        error: statusLookupError,
        meta: statusLookupMeta,
        fetchStatusDropdownOptions: fetchStatusOptions,
        onKeywordChange: handleSearchInput,
      }),
    ],
    [
      inputValue,
      formattedStatusOptions,
      fetchParams,
      statusLookupLoading,
      statusLookupError,
      statusLookupMeta,
      fetchStatusOptions,
      handleSearchInput,
    ]
  );
  
  // --------------------------------------------------------
  // Submit handler
  // --------------------------------------------------------
  const handleSubmit = (data: Record<string, any>) => {
    const selectedOption = formattedStatusOptions.find(
      (opt) => opt.value === data.statusId
    );
    
    onSubmit({
      statusId: data.statusId,
      statusLabel: selectedOption?.label ?? "",
    });
  };
  
  return (
    <CustomForm
      fields={formFields}
      onSubmit={handleSubmit}
      submitButtonLabel="Update Status"
      disabled={loading}
      showSubmitButton={!loading}
      sx={{ maxWidth: 500 }}
    />
  );
};

export default UpdateProductStatusForm;
