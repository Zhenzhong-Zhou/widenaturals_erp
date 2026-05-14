import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBatchRegistryForInventoryLookup } from '@hooks/index';
import type {
  BatchRegistryForInventoryLookupQuery,
  BatchRegistryLookupItem,
} from '@features/lookup';
import type { BatchTypeFilter } from '@shared-types/batch';
import type { BatchLookupBundle } from './BatchLookupContext';

interface UseCreateInventoryBatchLookupArgs {
  open: boolean;
  warehouseId: string;
}

interface UseCreateInventoryBatchLookupResult {
  bundle: BatchLookupBundle;
  globalBatchType: BatchTypeFilter;
  pickedBatches: Record<string, BatchRegistryLookupItem>;
  handleBatchTypeChange: (
    e: MouseEvent<HTMLElement>,
    next: BatchTypeFilter | null
  ) => void;
}

/**
 * Encapsulates the batch-registry lookup state for CreateInventoryModal:
 * the global type filter, per-row search inputs, paginated fetch params,
 * and the session-scoped cache of picked batches that keeps selections
 * sticky across filter changes.
 *
 * Returned `bundle` is suitable for dropping straight into
 * BatchLookupContext.Provider.
 */
export const useCreateInventoryBatchLookup = ({
  open,
  warehouseId,
}: UseCreateInventoryBatchLookupArgs): UseCreateInventoryBatchLookupResult => {
  const {
    items: batchRegistryOptions,
    loading: batchLookupLoading,
    error: batchLookupError,
    meta: batchLookupMeta,
    fetchLookup: fetchBatchRegistryLookup,
    resetLookup: resetBatchRegistryLookup,
  } = useBatchRegistryForInventoryLookup();

  const [globalBatchType, setGlobalBatchType] =
    useState<BatchTypeFilter>('all');
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [fetchParamsArray, setFetchParamsArray] = useState<
    BatchRegistryForInventoryLookupQuery[]
  >([]);
  const [pickedBatches, setPickedBatches] = useState<
    Record<string, BatchRegistryLookupItem>
  >({});

  const cachePickedBatch = useCallback((item: BatchRegistryLookupItem) => {
    setPickedBatches((prev) =>
      prev[item.id] ? prev : { ...prev, [item.id]: item }
    );
  }, []);

  const defaultLookupQuery = useMemo<BatchRegistryForInventoryLookupQuery>(
    () => ({
      keyword: '',
      limit: 10,
      offset: 0,
      warehouseId,
      ...(globalBatchType !== 'all' && { batchType: globalBatchType }),
    }),
    [warehouseId, globalBatchType]
  );

  const fetchRef = useRef(fetchBatchRegistryLookup);
  const resetRef = useRef(resetBatchRegistryLookup);
  fetchRef.current = fetchBatchRegistryLookup;
  resetRef.current = resetBatchRegistryLookup;

  // Cleanup on close only — query changes do not reset row state.
  useEffect(() => {
    if (!open) return;
    return () => {
      resetRef.current();
      setInputValues([]);
      setFetchParamsArray([]);
      setPickedBatches({});
    };
  }, [open]);

  // Refetch when modal opens or filter changes.
  useEffect(() => {
    if (!open) return;
    fetchRef.current(defaultLookupQuery);
  }, [open, defaultLookupQuery]);

  const handleBatchTypeChange = useCallback(
    (_e: MouseEvent<HTMLElement>, next: BatchTypeFilter | null) => {
      if (!next) return;
      setGlobalBatchType((prev) => (next === prev ? prev : next));
    },
    []
  );

  const fetchOptions = useCallback(
    (params: BatchRegistryForInventoryLookupQuery) => fetchRef.current(params),
    []
  );

  const bundle = useMemo<BatchLookupBundle>(
    () => ({
      inputValues,
      setInputValues,
      fetchParamsArray,
      setFetchParamsArray,
      options: batchRegistryOptions,
      loading: batchLookupLoading,
      error: batchLookupError,
      paginationMeta: batchLookupMeta,
      fetchOptions,
      defaultQuery: defaultLookupQuery,
      globalBatchType,
      pickedBatches,
      cachePickedBatch,
    }),
    [
      inputValues,
      fetchParamsArray,
      batchRegistryOptions,
      batchLookupLoading,
      batchLookupError,
      batchLookupMeta,
      fetchOptions,
      defaultLookupQuery,
      globalBatchType,
      pickedBatches,
      cachePickedBatch,
    ]
  );

  return { bundle, globalBatchType, pickedBatches, handleBatchTypeChange };
};
