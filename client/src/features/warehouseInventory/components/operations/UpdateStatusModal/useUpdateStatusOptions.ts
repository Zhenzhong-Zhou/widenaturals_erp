import { useEffect, useState } from 'react';
import { useInventoryStatusLookup } from '@hooks/index';
import type { InventoryStatusLookupParams } from '@features/lookup';
import { useFormattedOptionLabels } from '@features/lookup/utils/formatOptionLabels';

const DEFAULT_STATUS_FETCH_PARAMS: InventoryStatusLookupParams = {
  keyword: '',
  limit: 100,
  offset: 0,
};

export const useUpdateStatusOptions = (open: boolean) => {
  const { options, loading, error, meta, fetch, reset } =
    useInventoryStatusLookup();

  const [statusFetchParams, setStatusFetchParams] =
    useState<InventoryStatusLookupParams>(DEFAULT_STATUS_FETCH_PARAMS);

  useEffect(() => {
    if (!open) return;

    fetch(statusFetchParams);

    // Initial fetch only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fetch]);

  useEffect(() => {
    if (open) return;

    reset();
    setStatusFetchParams(DEFAULT_STATUS_FETCH_PARAMS);
  }, [open, reset]);

  const statusOptions = useFormattedOptionLabels(options);

  return {
    statusOptions,
    statusLoading: loading,
    statusError: error,
    statusPaginationMeta: meta,
    statusFetchParams,
    setStatusFetchParams,
    fetchStatusOptions: fetch,
  };
};
