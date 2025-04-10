import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchWarehouseDetailsThunk,
  selectWarehouseDetails,
  selectWarehouseDetailsError,
  selectWarehouseDetailsLoading,
} from '@features/warehouse';
import { WarehouseDetails } from '@features/warehouse/state';

/**
 * Custom hook to fetch and memoize warehouse details.
 * - Fetches warehouse details when `warehouseId` is provided.
 * - Uses `useMemo` to prevent unnecessary re-computation.
 * - Uses `useCallback` to avoid unnecessary function re-creation.
 */
const useWarehouseDetails = (warehouseId?: string) => {
  const dispatch = useAppDispatch();

  // Select warehouse state from Redux
  const warehouseResponse = useAppSelector(selectWarehouseDetails); // This is WarehouseDetailsResponse | null
  const loading = useAppSelector(selectWarehouseDetailsLoading);
  const error = useAppSelector(selectWarehouseDetailsError);

  /** Extract `data` from WarehouseDetailsResponse, or return null */
  const warehouseDetails: WarehouseDetails | undefined = useMemo(() => {
    return warehouseResponse?.data ?? undefined;
  }, [warehouseResponse]);

  /** Fetch warehouse details when `warehouseId` changes */
  const fetchWarehouse = useCallback(() => {
    if (warehouseId && !loading) {
      dispatch(fetchWarehouseDetailsThunk({ warehouseId }));
    }
  }, [dispatch, warehouseId]);

  /** Expose a manual refetch function */
  const refetch = useCallback(() => {
    if (warehouseId && !loading) {
      dispatch(fetchWarehouseDetailsThunk({ warehouseId }));
    }
  }, [dispatch, warehouseId, loading]);

  useEffect(() => {
    fetchWarehouse();
  }, [fetchWarehouse]);

  /** Memoize the returned values to prevent unnecessary re-renders */
  return useMemo(
    () => ({
      warehouseDetails,
      loading,
      error,
      refetch,
    }),
    [warehouseDetails, loading, error, refetch]
  );
};

export default useWarehouseDetails;
