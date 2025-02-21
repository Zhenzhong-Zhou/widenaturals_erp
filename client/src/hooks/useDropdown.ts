import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchInventoryDropdownData,
  selectDropdownLoading,
  selectProductDropdown,
  selectWarehouseDropdown,
} from '../features/warehouse-inventory';

/**
 * Custom hook to fetch dropdown data globally.
 * This will only fetch data once and provide cached values.
 */
const useDropdown = () => {
  const dispatch = useAppDispatch();
  
  // Memoized selectors
  const products = useAppSelector(selectProductDropdown);
  const warehouses = useAppSelector(selectWarehouseDropdown);
  const loading = useAppSelector(selectDropdownLoading);
  
  // Fetch default dropdowns (products & warehouses)
  useEffect(() => {
    dispatch(fetchInventoryDropdownData());
  }, [dispatch]);
  
  return { products, warehouses, loading };
};

export default useDropdown;
