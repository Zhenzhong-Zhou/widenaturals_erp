import { useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchProductsDropDownByWarehouseThunk,
  selectDropdownLoading,
  selectProductDropdown,
  selectDropdownError,
  type ProductDropdownItem,
} from '@features/warehouse-inventory';

/**
 * Custom hook to fetch product dropdown data for a specific warehouse.
 * - Fetches products dynamically based on the provided `warehouseId`.
 * - Provides a refresh function to manually trigger fetching.
 * - Prevents redundant fetching.
 */
const useProductsWarehouseDropdown = (warehouseId: string) => {
  const dispatch = useAppDispatch();

  // Select state from Redux
  const allProducts = useAppSelector(selectProductDropdown);
  const loading = useAppSelector(selectDropdownLoading);
  const error = useAppSelector(selectDropdownError);

  // Fetch products dynamically when warehouseId changes
  const fetchProducts = useCallback(() => {
    if (warehouseId) {
      dispatch(fetchProductsDropDownByWarehouseThunk({ warehouseId }));
    }
  }, [dispatch, warehouseId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /** Memoize products to avoid unnecessary re-renders */
  const uniqueProducts = useMemo(() => {
    const productMap = new Map();
    allProducts.forEach((product: ProductDropdownItem) => {
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
    refreshProducts: fetchProducts,
  };
};

export default useProductsWarehouseDropdown;
