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
  const [warehouseInventoryDetailPage, setWarehouseInventoryDetailPage] = useState<number>(initialPage);
  const [warehouseInventoryDetailLimit, setWarehouseInventoryDetailLimit] = useState<number>(initialLimit);
  
  // Redux state selectors
  const warehouseInventoryDetails = useAppSelector(selectWarehouseInventoryDetails);
  const warehouseInventoryDetailPagination = useAppSelector(selectWarehouseInventoryDetailPagination);
  const warehouseInventoryDetailLoading = useAppSelector(selectWarehouseInventoryDetailLoading);
  const warehouseInventoryDetailError = useAppSelector(selectWarehouseInventoryDetailError);
  
  // Fetch warehouse inventory details on mount & when dependencies change
  useEffect(() => {
    if (warehouseId) {
      dispatch(fetchWarehouseInventoryDetailsThunk({ warehouseId, warehouseInventoryDetailPage, warehouseInventoryDetailLimit }));
    }
  }, [dispatch, warehouseId, warehouseInventoryDetailPage, warehouseInventoryDetailLimit]);
  
  // Manual refresh function
  const refreshWarehouseInventoryDetails = () => {
    dispatch(fetchWarehouseInventoryDetailsThunk({ warehouseId, warehouseInventoryDetailPage, warehouseInventoryDetailLimit }));
  };
  
  return {
    warehouseInventoryDetails,
    warehouseInventoryDetailPagination,
    warehouseInventoryDetailLoading,
    warehouseInventoryDetailError,
    warehouseInventoryDetailPage,
    warehouseInventoryDetailLimit,
    setWarehouseInventoryDetailPage,
    setWarehouseInventoryDetailLimit,
    refreshWarehouseInventoryDetails,
  };
};

export default useWarehouseInventoryDetails;
