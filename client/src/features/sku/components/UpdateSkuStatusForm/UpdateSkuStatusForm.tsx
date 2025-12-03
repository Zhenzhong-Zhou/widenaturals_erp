import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from '@mui/material';
import type {
  StatusLookupParams,
  LookupPaginationMeta,
  StatusLookupOption,
} from '@features/lookup/state';
import {
  createLookupParams,
  normalizeLookupParams,
} from '@features/lookup/utils/lookupUtils';
import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import { createStatusField } from '@features/sku/components/UpdateSkuStatusForm';

interface UpdateSkuStatusFormProps {
  /** Whether the entire form is submitting / updating status */
  loading?: boolean;

  /**
   * Handler invoked when the form submits.
   * The payload includes the selected status_id and optional note.
   */
  onSubmit: (data: { statusId: string }) => void | Promise<void>;

  /** SKU being updated (display purposes only) */
  skuId: string;

  /** Dropdown-ready status options */
  statusDropdownOptions?: StatusLookupOption[];

  /** Fetch function used to load status options (pagination, search, refresh) */
  fetchStatusDropdownOptions?: (params?: StatusLookupParams) => void;

  resetStatusDropdownOptions?: () => void;

  /** Whether the status lookup is currently loading */
  statusLookupLoading?: boolean;

  /** Error from status lookup */
  statusLookupError?: string | null;

  /** Pagination metadata for the status lookup results */
  statusLookupMeta?: LookupPaginationMeta;

  /** Whether more status options can be loaded (optional) */
  hasMoreStatusOptions?: boolean;
}

const UpdateSkuStatusForm: FC<UpdateSkuStatusFormProps> = ({
  loading,
  onSubmit,
  statusDropdownOptions = [],
  fetchStatusDropdownOptions,
  resetStatusDropdownOptions,
  statusLookupLoading,
  statusLookupError,
  statusLookupMeta,
}) => {
  /** Controlled search + pagination */
  const [inputValue, setInputValue] = useState('');
  const [fetchParams, setFetchParams] =
    useState(createLookupParams<StatusLookupParams>());

  /** Debounced fetch */
  const debouncedFetch = useMemo(
    () =>
      debounce((params: StatusLookupParams) => {
        fetchStatusDropdownOptions?.(params);
      }, 300),
    [fetchStatusDropdownOptions]
  );

  useEffect(() => {
    debouncedFetch(normalizeLookupParams(fetchParams));
  }, [fetchParams, debouncedFetch, normalizeLookupParams]);

  /** Reset handler */
  const handleResetLookup = useCallback(() => {
    setInputValue('');
    const resetParams = createLookupParams<StatusLookupParams>();
    setFetchParams(resetParams);

    resetStatusDropdownOptions?.();

    fetchStatusDropdownOptions?.(resetParams);
  }, [resetStatusDropdownOptions, fetchStatusDropdownOptions]);

  useEffect(() => {
    return () => handleResetLookup();
  }, [handleResetLookup]);

  /** Form fields definition */
  const formFields = useMemo<FieldConfig[]>(
    () => [
      createStatusField({
        inputValue,
        setInputValue,
        fetchParams,
        setFetchParams,
        options: statusDropdownOptions,
        loading: statusLookupLoading,
        error: statusLookupError,
        meta: statusLookupMeta,
        fetchStatusDropdownOptions,
      }),
    ],
    [
      inputValue,
      fetchParams,
      statusDropdownOptions,
      statusLookupLoading,
      statusLookupError,
      statusLookupMeta,
      fetchStatusDropdownOptions,
      normalizeLookupParams,
    ]
  );

  const handleSubmit = (data: Record<string, any>) => {
    onSubmit({
      statusId: data.status_id,
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

export default UpdateSkuStatusForm;
