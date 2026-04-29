import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedPricingThunk,
  selectPaginatedPricingData,
  selectPaginatedPricingPagination,
  selectPaginatedPricingLoading,
  selectPaginatedPricingError,
  selectPaginatedPricingTotalRecords,
  selectPaginatedPricingIsEmpty,
} from '@features/pricing/state';
import type { PricingQueryParams } from '@features/pricing';
import { resetPaginatedPricing } from '@features/pricing/state/paginatedPricingSlice';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * React hook that provides access to paginated pricing join list state and actions.
 *
 * Exposes:
 * - Pricing list data
 * - Loading & error state
 * - Pagination metadata
 * - Total record count
 * - Empty state indicator
 * - Actions to fetch or reset pricing list
 *
 * This hook should be used by all pricing list pages and list-based components.
 */
const usePaginatedPricing = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors
  // ---------------------------
  const data       = useAppSelector(selectPaginatedPricingData);
  const pagination = useAppSelector(selectPaginatedPricingPagination);
  const loading    = useAppSelector(selectPaginatedPricingLoading);
  const error      = useAppSelector(selectPaginatedPricingError);
  const totalRecords = useAppSelector(selectPaginatedPricingTotalRecords);
  const isEmpty    = useAppSelector(selectPaginatedPricingIsEmpty);
  
  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated pricing join records.
   * Accepts pagination, sorting, and filter parameters.
   */
  const fetchPricing = useCallback(
    (params: PricingQueryParams) => {
      dispatch(fetchPaginatedPricingThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset pricing list state back to initial empty paginated state.
   */
  const resetPricing = useCallback(() => {
    dispatch(resetPaginatedPricing());
  }, [dispatch]);
  
  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(() => {
    const { page, limit } = normalizePagination(pagination);
    return { page, limit };
  }, [pagination]);
  
  return {
    data,
    pagination,
    loading,
    error,
    totalRecords,
    isEmpty,
    
    pageInfo,
    
    fetchPricing,
    resetPricing,
  };
};

export default usePaginatedPricing;
