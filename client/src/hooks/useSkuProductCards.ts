import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedSkuProductCardsThunk,
  selectSkuProductCardViewItems,
  selectSkuProductCardPagination,
  selectSkuProductCardLoading,
  selectSkuProductCardError,
  selectSkuProductCardsIsEmpty,
  resetSkuProductCards,
} from '@features/sku/state';
import type {
  SkuProductCardQueryParams,
} from '@features/sku/state';

/**
 * React hook exposing SKU Product-Card list state + actions.
 *
 * Provides:
 *  - UI-ready items (mapped via selector)
 *  - pagination metadata
 *  - loading / error flags
 *  - last-used query parameters
 *  - fetch() function (memoized)
 *  - reset() function
 */
export const useSkuProductCards = () => {
  const dispatch = useAppDispatch();

  // -------------------------------------
  // Select state from Redux
  // -------------------------------------
  const items = useAppSelector(selectSkuProductCardViewItems);
  const pagination = useAppSelector(selectSkuProductCardPagination);
  const loading = useAppSelector(selectSkuProductCardLoading);
  const error = useAppSelector(selectSkuProductCardError);
  const isEmpty = useAppSelector(selectSkuProductCardsIsEmpty);

  // -------------------------------------
  // Memoized fetcher
  // -------------------------------------
  const fetchCards = useCallback(
    (query?: SkuProductCardQueryParams) => {
      return dispatch(fetchPaginatedSkuProductCardsThunk(query));
    },
    [dispatch]
  );

  // -------------------------------------
  // Memoized reset
  // -------------------------------------
  const reset = useCallback(() => {
    dispatch(resetSkuProductCards());
  }, [dispatch]);

  // -------------------------------------
  // Memoized return object (optional but clean)
  // -------------------------------------
  return useMemo(
    () => ({
      items,
      pagination,
      loading,
      error,
      isEmpty,
      fetchCards,
      reset,
    }),
    [items, pagination, loading, error, isEmpty, fetchCards, reset]
  );
};

export default useSkuProductCards;
