import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  BulkInsertInventoryRequest,
  bulkInsertWarehouseInventoryThunk,
  selectWarehouseInventoryInsertData, selectWarehouseInventoryInsertError,
  selectWarehouseInventoryInsertLoading,
} from '../features/warehouse-inventory';

/**
 * Custom hook to handle bulk inserting warehouse inventory
 */
const useBulkInsertWarehouseInventory = () => {
  const dispatch = useAppDispatch();
  
  // Select state values
  const inventoryData = useAppSelector(selectWarehouseInventoryInsertData);
  const isLoading = useAppSelector(selectWarehouseInventoryInsertLoading);
  const error = useAppSelector(selectWarehouseInventoryInsertError);
  
  /**
   * Handles bulk insert action with correct type
   * @param {BulkInsertInventoryRequest} request - Object containing inventory data
   */
  const handleBulkInsert = useCallback(
    async (request: BulkInsertInventoryRequest) => {
      dispatch(bulkInsertWarehouseInventoryThunk(request));
    },
    [dispatch]
  );
  
  return {
    inventoryData,
    isLoading,
    error,
    handleBulkInsert,
  };
};

export default useBulkInsertWarehouseInventory;
