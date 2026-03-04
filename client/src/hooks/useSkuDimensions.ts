import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuDimensionsData,
  selectSkuDimensionsLoading,
  selectSkuDimensionsError,
  selectSkuDimensionsSuccess,
  selectUpdatedSkuDimensionsId,
  updateSkuDimensionsThunk,
} from '@features/sku/state';
import type { UpdateSkuDimensionsRequest } from '@features/sku/state';
import { resetSkuDimensions } from '@features/sku/state/skuDimensionsSlice';

/**
 * Hook providing a clean interface for updating SKU dimensions.
 */
const useSkuDimensions = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectSkuDimensionsData);
  const loading = useAppSelector(selectSkuDimensionsLoading);
  const error = useAppSelector(selectSkuDimensionsError);
  const isSuccess = useAppSelector(selectSkuDimensionsSuccess);
  const updatedSkuId = useAppSelector(selectUpdatedSkuDimensionsId);
  
  const updateDimensions = useCallback(
    async (skuId: string, payload: UpdateSkuDimensionsRequest) => {
      return dispatch(updateSkuDimensionsThunk({ skuId, payload }));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetSkuDimensions());
  }, [dispatch]);
  
  return useMemo(
    () => ({
      data,
      loading,
      error,
      isSuccess,
      updatedSkuId,
      updateDimensions,
      reset,
    }),
    [data, loading, error, isSuccess, updatedSkuId, updateDimensions, reset]
  );
};

export default useSkuDimensions;
