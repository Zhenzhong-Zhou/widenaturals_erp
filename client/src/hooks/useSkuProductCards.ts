import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import { useCallback } from 'react';
import {
  fetchSkuProductCardsThunk,
  selectSkuProductCards,
  selectSkuProductError,
  selectSkuProductLoading,
  selectSkuProductPagination,
  type SkuProductCardFilters,
} from '@features/product/state';

/**
 * Hook to access SKU product card data from Redux.
 * Provides access to data, pagination, loading, and a manual refresh function.
 *
 * @param {SkuProductCardFilters} initialFilters - Default filters to apply when refreshing
 */
const useSkuProductCards = (initialFilters: SkuProductCardFilters = {}) => {
  const dispatch = useAppDispatch();

  const skuCardList = useAppSelector(selectSkuProductCards);
  const skuCardPagination = useAppSelector(selectSkuProductPagination);
  const isSkuCardLoading = useAppSelector(selectSkuProductLoading);
  const skuCardError = useAppSelector(selectSkuProductError);

  const refreshSkuCards = useCallback(
    (
      page: number = 1,
      limit: number = 10,
      filters: SkuProductCardFilters = initialFilters
    ) => {
      dispatch(fetchSkuProductCardsThunk({ page, limit, filters }));
    },
    [dispatch, initialFilters]
  );

  return {
    skuCardList,
    skuCardPagination,
    isSkuCardLoading,
    skuCardError,
    refreshSkuCards,
  };
};

export default useSkuProductCards;
