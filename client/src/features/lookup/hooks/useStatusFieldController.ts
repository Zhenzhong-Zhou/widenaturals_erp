import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  normalizeLookupParams,
  createLookupParams,
} from '@features/lookup/utils/lookupUtils';
import { useStatusSearchHandlers } from '@features/lookup/hooks';
import type {
  StatusLookupParams,
  LookupPaginationMeta,
  StatusLookupOption,
} from '@features/lookup/state';
import type { FieldConfig } from '@components/common/CustomForm';
import {
  formatOptionLabel,
  formatOptionLabels,
} from '@features/lookup/utils/formatOptionLabels';

export interface StatusLookupController {
  options: StatusLookupOption[];
  loading: boolean;
  error: string | null;
  meta: LookupPaginationMeta | undefined;
  fetch: (params?: StatusLookupParams) => void;
  reset: () => void;
}

interface UseStatusFieldControllerArgs {
  lookup: StatusLookupController;
  createField: (params: any) => FieldConfig;
  currentStatusId?: string;
  currentStatusName?: string;
}

export type StatusPayload = {
  statusId: string;
  statusLabel: string; // always required now
};

const useStatusFieldController = ({
  lookup,
  createField,
  currentStatusId,
  currentStatusName,
}: UseStatusFieldControllerArgs) => {
  const { options, loading, error, meta, fetch, reset } = lookup;

  const formattedStatusOptions = useMemo<StatusLookupOption[]>(() => {
    const formatted = formatOptionLabels(options);

    // ensure current value exists in list
    if (
      currentStatusId &&
      currentStatusName &&
      !formatted.some((option) => option.value === currentStatusId)
    ) {
      const currentStatusOption: StatusLookupOption = {
        value: currentStatusId,
        label: currentStatusName,
        isActive: true,
      };

      formatted.unshift(formatOptionLabel(currentStatusOption));
    }

    return formatted;
  }, [options, currentStatusId, currentStatusName]);

  // keyword + pagination state
  const [inputValue, setInputValue] = useState('');
  const [fetchParams, setFetchParams] =
    useState(createLookupParams<StatusLookupParams>());

  // debounced search handler
  const { handleStatusSearch } = useStatusSearchHandlers({ fetch });

  const handleKeyword = (keyword: string) => {
    setInputValue(keyword);
    setFetchParams((prev) =>
      normalizeLookupParams({
        ...prev,
        keyword,
        offset: 0,
      })
    );
    handleStatusSearch(keyword);
  };

  // reset on unmount
  const handleResetLookup = useCallback(() => {
    setInputValue('');
    const resetParams = createLookupParams<StatusLookupParams>();
    setFetchParams(resetParams);
    reset();
    fetch(resetParams);
  }, [reset, fetch]);

  useEffect(() => {
    return () => handleResetLookup();
  }, [handleResetLookup]);

  // FieldConfig for CustomForm
  const formFields = useMemo<FieldConfig[]>(
    () => [
      createField({
        inputValue,
        setInputValue,
        fetchParams,
        setFetchParams,
        options: formattedStatusOptions,
        loading,
        error,
        meta,
        fetchStatusDropdownOptions: fetch,
        onKeywordChange: handleKeyword,
      }),
    ],
    [
      inputValue,
      formattedStatusOptions,
      fetchParams,
      loading,
      error,
      meta,
      fetch,
      handleKeyword,
    ]
  );

  // -----------------------------------------
  // Always return `{ statusId, statusLabel }`
  // -----------------------------------------
  const buildSubmitPayload = (data: Record<string, any>): StatusPayload => {
    const statusId = data.statusId;

    const selected = formattedStatusOptions.find(
      (opt) => opt.value === statusId
    );

    return {
      statusId,
      statusLabel: selected?.label ?? '',
    };
  };

  return {
    formFields,
    formattedStatusOptions,
    buildSubmitPayload,
  };
};

export default useStatusFieldController;
