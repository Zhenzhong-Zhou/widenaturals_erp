import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchWarehouseInventoryDetailsThunk,
  selectWarehouseInventoryDetailError,
  selectWarehouseInventoryDetailLoading,
  selectWarehouseInventoryDetailPagination,
  selectWarehouseInventoryDetails,
} from '../features/warehouse-inventory';

const useWarehouseInventoryDetails = (warehouseId: string, initialPage: number = 1, initialLimit: number = 10) => {
  const dispatch = useAppDispatch();
  
  // Local pagination state
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  
  // Redux state selectors
  const inventoryDetails = useAppSelector(selectWarehouseInventoryDetails);
  const pagination = useAppSelector(selectWarehouseInventoryDetailPagination);
  const loading = useAppSelector(selectWarehouseInventoryDetailLoading);
  const error = useAppSelector(selectWarehouseInventoryDetailError);
  console.log('useWarehouseInventoryDetails', inventoryDetails);
  // Fetch warehouse inventory details on mount & when dependencies change
  useEffect(() => {
    if (warehouseId) {
      dispatch(fetchWarehouseInventoryDetailsThunk({ warehouseId, page, limit }));
    }
  }, [dispatch, warehouseId, page, limit]);
  
  // Manual refresh function
  const refresh = () => {
    dispatch(fetchWarehouseInventoryDetailsThunk({ warehouseId, page, limit }));
  };
  
  return {
    inventoryDetails,
    pagination,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refresh,
  };
};

export default useWarehouseInventoryDetails;
