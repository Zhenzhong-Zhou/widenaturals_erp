import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchProductsDropDownByWarehouseThunk,
  selectDropdownLoading,
  selectProductDropdown,
  selectDropdownError,
} from '../features/warehouse-inventory';

/**
 * Custom hook to fetch product dropdown data for a specific warehouse.
 * - Fetches products dynamically based on the provided `warehouseId`.
 * - Prevents redundant fetching.
 */
const useDropdown = (warehouseId: string) => {
  const dispatch = useAppDispatch();

  // Select state from Redux
  const allProducts = useAppSelector(selectProductDropdown);
  const loading = useAppSelector(selectDropdownLoading);
  const error = useAppSelector(selectDropdownError);

  // Fetch products dynamically when warehouseId changes
  useEffect(() => {
    if (warehouseId) {
      dispatch(fetchProductsDropDownByWarehouseThunk({ warehouseId }));
    }
  }, [dispatch, warehouseId]);

  /** Memoize products to avoid unnecessary re-renders */
  const uniqueProducts = useMemo(() => {
    const productMap = new Map();
    allProducts.forEach((product) => {
      if (!productMap.has(product.product_id)) {
        productMap.set(product.product_id, product);
      }
    });
    return [...productMap.values()];
  }, [allProducts]);

  return {
    products: uniqueProducts,
    loading,
    error,
  };
};

export default useDropdown;
