import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchProductsForOrdersDropdownThunk,
  selectProductOrderDropdown,
  selectProductOrderDropdownError,
  selectProductOrderDropdownLoading,
} from '@features/product';

/**
 * Custom hook to manage product orders dropdown state.
 */
const useProductOrderDropdown = (
  search: string | null = null,
  limit: number = 100
) => {
  const dispatch = useAppDispatch();

  // Accessing state using memoized selectors
  const products = useAppSelector(selectProductOrderDropdown);
  const loading = useAppSelector(selectProductOrderDropdownLoading);
  const error = useAppSelector(selectProductOrderDropdownError);

  // Fetch data when the hook is used or dependencies change
  useEffect(() => {
    dispatch(fetchProductsForOrdersDropdownThunk({ search, limit }));
  }, [dispatch, search, limit]);

  // Refresh function for manually triggering the fetch
  const refreshProducts = useCallback(() => {
    dispatch(fetchProductsForOrdersDropdownThunk({ search, limit }));
  }, [dispatch, search, limit]);

  return { products, loading, error, refreshProducts };
};

export default useProductOrderDropdown;
