import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { PricingTypeQueryParams } from '@features/pricingType';
import {
  selectPaginatedPricingTypeData,
  selectPaginatedPricingTypePagination,
  selectPaginatedPricingTypeLoading,
  selectPaginatedPricingTypeError,
  selectPaginatedPricingTypeIsEmpty,
  fetchPaginatedPricingTypesThunk,
} from '@features/pricingType';
import { resetPaginatedPricingTypes } from '@features/pricingType/state/paginatedPricingTypesSlice';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * usePaginatedPricingTypes
 *
 * Returns paginated pricing type data from Redux state.
 *
 * Responsibilities:
 * - Exposes pricing type records from Redux state
 * - Provides pagination, loading, and error state
 * - Encapsulates fetch/reset actions for the pricing type list
 *
 * Design notes:
 * - Data returned from this hook is presentation-ready
 * - Consumers MUST NOT re-map or re-transform records
 */
export const usePaginatedPricingTypes = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedPricingTypeData);
  const pagination = useAppSelector(selectPaginatedPricingTypePagination);
  const loading = useAppSelector(selectPaginatedPricingTypeLoading);
  const error = useAppSelector(selectPaginatedPricingTypeError);
  const isEmpty = useAppSelector(selectPaginatedPricingTypeIsEmpty);
  
  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated pricing type records using Redux thunk.
   *
   * Parameters may include pagination, sorting, and filtering.
   */
  const fetchPricingTypes = useCallback(
    (params: PricingTypeQueryParams) => {
      dispatch(fetchPaginatedPricingTypesThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset paginated pricing type state back to the initial empty form.
   *
   * Typically used when:
   * - leaving the pricing type page
   * - switching modules
   * - performing a full filter reset
   */
  const resetPricingTypes = useCallback(() => {
    dispatch(resetPaginatedPricingTypes());
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
    
    fetchPricingTypes,
    resetPricingTypes,
  };
};

export default usePaginatedPricingTypes;
