import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchBatchRegistryForInventoryLookupThunk,
  selectBatchRegistryForInventoryLookupError,
  selectBatchRegistryForInventoryLookupItems,
  selectBatchRegistryForInventoryLookupLoading,
  selectBatchRegistryForInventoryLookupMeta,
} from '@features/lookup/state';
import type { BatchRegistryForInventoryLookupQuery } from '@features/lookup/state';
import { resetBatchRegistryForInventoryLookup } from '@features/lookup/state/batchRegistryForInventoryLookupSlice';

/**
 * Custom hook to access batch registry for-inventory lookup state and actions.
 *
 * Returns paginated batch registry data scoped to a target warehouse, used by
 * the warehouse-inventory batch-add flow. `warehouseId` is required on every
 * fetch call — the type system enforces this at the call site.
 *
 * @returns Object containing lookup data, loading state, error, pagination metadata, and actions
 */
const useBatchRegistryForInventoryLookup = () => {
  const dispatch = useAppDispatch();
  
  const items = useAppSelector(selectBatchRegistryForInventoryLookupItems);
  const loading = useAppSelector(selectBatchRegistryForInventoryLookupLoading);
  const error = useAppSelector(selectBatchRegistryForInventoryLookupError);
  const meta = useAppSelector(selectBatchRegistryForInventoryLookupMeta);
  
  const fetchLookup = useCallback(
    (params: BatchRegistryForInventoryLookupQuery) =>
      dispatch(fetchBatchRegistryForInventoryLookupThunk(params)),
    [dispatch]
  );
  
  const resetLookup = useCallback(
    () => dispatch(resetBatchRegistryForInventoryLookup()),
    [dispatch]
  );
  
  return {
    items,
    loading,
    error,
    meta,
    fetchLookup,
    resetLookup,
  };
};

export default useBatchRegistryForInventoryLookup;
