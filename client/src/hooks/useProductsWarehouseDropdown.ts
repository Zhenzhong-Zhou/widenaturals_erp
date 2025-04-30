import { useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchProductsDropDownByWarehouseThunk,
  fetchWarehousesDropdownThunk,
  selectProductDropdown,
  selectWarehouseDropdown,
  selectProductDropdownLoading,
  selectProductDropdownError,
  selectWarehouseDropdownLoading,
  selectWarehouseDropdownError,
  type ProductDropdownItem,
} from '@features/warehouseInventory';

/**
 * Hook to fetch and manage both product and warehouse dropdowns.
 * - Products are fetched based on the provided `warehouseId`.
 * - Warehouses are fetched on mount and manually via `refreshWarehouses`.
 * - Each has independent loading and error states.
 */
const useProductsWarehouseDropdown = (warehouseId?: string) => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const allProducts = useAppSelector(selectProductDropdown);
  const warehouses = useAppSelector(selectWarehouseDropdown);
  const productLoading = useAppSelector(selectProductDropdownLoading);
  const productError = useAppSelector(selectProductDropdownError);
  const warehouseLoading = useAppSelector(selectWarehouseDropdownLoading);
  const warehouseError = useAppSelector(selectWarehouseDropdownError);
  
  // Fetch warehouses on mount
  const fetchWarehouses = useCallback(() => {
    dispatch(fetchWarehousesDropdownThunk());
  }, [dispatch]);
  
  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);
  
  // Fetch products when warehouse changes
  const fetchProducts = useCallback(() => {
    if (warehouseId) {
      dispatch(fetchProductsDropDownByWarehouseThunk({ warehouseId }));
    }
  }, [dispatch, warehouseId]);
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  // De-duplicate product list
  const uniqueProducts = useMemo(() => {
    const productMap = new Map<string, ProductDropdownItem>();
    for (const product of allProducts) {
      if (!productMap.has(product.product_id)) {
        productMap.set(product.product_id, product);
      }
    }
    return [...productMap.values()];
  }, [allProducts]);
  
  return {
    products: uniqueProducts,
    warehouses,
    productLoading,
    productError,
    warehouseLoading,
    warehouseError,
    refreshProducts: fetchProducts,
    refreshWarehouses: fetchWarehouses,
  };
};

export default useProductsWarehouseDropdown;
