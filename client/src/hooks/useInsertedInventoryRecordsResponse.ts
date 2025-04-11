import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchInsertedInventoryRecordsThunk,
  type InsertInventoryRequestBody,
  selectInsertedInventoryRecordsResponseData,
  selectInsertedInventoryRecordsResponseError,
  selectInsertedInventoryRecordsResponseLoading,
} from '@features/warehouse-inventory';

const useInsertedInventoryRecordsResponse = () => {
  const dispatch = useAppDispatch();

  // Selectors with memoization
  const data = useAppSelector(selectInsertedInventoryRecordsResponseData);
  const loading = useAppSelector(selectInsertedInventoryRecordsResponseLoading);
  const error = useAppSelector(selectInsertedInventoryRecordsResponseError);

  // Memoized data object
  const insertedInventoryState = useMemo(
    () => ({ data, loading, error }),
    [data, loading, error]
  );

  // Function to fetch inserted inventory records
  const fetchInsertedInventoryRecords = useCallback(
    async (requestBody: InsertInventoryRequestBody) => {
      try {
        return await dispatch(
          fetchInsertedInventoryRecordsThunk(requestBody)
        ).unwrap();
      } catch (error) {
        console.error('Failed to fetch inserted inventory records:', error);
        throw error;
      }
    },
    [dispatch]
  );

  return {
    ...insertedInventoryState,
    fetchInsertedInventoryRecords,
  };
};

export default useInsertedInventoryRecordsResponse;
