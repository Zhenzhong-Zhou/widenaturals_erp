import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { PricingGroupQueryParams } from '@features/pricingGroup';
import {
  selectPaginatedPricingGroupData,
  selectPaginatedPricingGroupPagination,
  selectPaginatedPricingGroupLoading,
  selectPaginatedPricingGroupError,
  selectPaginatedPricingGroupIsEmpty,
  fetchPaginatedPricingGroupsThunk,
} from '@features/pricingGroup';
import { resetPaginatedPricingGroups } from '@features/pricingGroup/state/paginatedPricingGroupsSlice';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * usePaginatedPricingGroups
 *
 * Returns paginated pricing group data from Redux state.
 *
 * Responsibilities:
 * - Exposes pricing group records from Redux state
 * - Provides pagination, loading, and error state
 * - Encapsulates fetch/reset actions for the pricing group list
 *
 * Design notes:
 * - Data returned from this hook is presentation-ready
 * - Consumers MUST NOT re-map or re-transform records
 */
export const usePaginatedPricingGroups = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedPricingGroupData);
  const pagination = useAppSelector(selectPaginatedPricingGroupPagination);
  const loading = useAppSelector(selectPaginatedPricingGroupLoading);
  const error = useAppSelector(selectPaginatedPricingGroupError);
  const isEmpty = useAppSelector(selectPaginatedPricingGroupIsEmpty);
  
  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated pricing group records using Redux thunk.
   *
   * Parameters may include pagination, sorting, and filtering.
   */
  const fetchPricingGroups = useCallback(
    (params: PricingGroupQueryParams) => {
      dispatch(fetchPaginatedPricingGroupsThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset paginated pricing group state back to the initial empty form.
   *
   * Typically used when:
   * - leaving the pricing group page
   * - switching modules
   * - performing a full filter reset
   */
  const resetPricingGroups = useCallback(() => {
    dispatch(resetPaginatedPricingGroups());
  }, [dispatch]);
  
  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(() => normalizePagination(pagination), [pagination]);
  
  return {
    data,
    pagination,
    loading,
    error,
    isEmpty,
    
    pageInfo, // { page, limit }
    
    fetchPricingGroups,
    resetPricingGroups,
  };
};

export default usePaginatedPricingGroups;
