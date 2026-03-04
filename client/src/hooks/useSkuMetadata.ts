import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuMetadataData,
  selectSkuMetadataLoading,
  selectSkuMetadataError,
  selectSkuMetadataSuccess,
  selectUpdatedSkuMetadataId,
  updateSkuMetadataThunk,
} from '@features/sku/state';
import type { UpdateSkuMetadataRequest } from '@features/sku/state';
import { resetSkuMetadata } from '@features/sku/state/skuMetadataSlice';

/**
 * Hook providing a clean interface for updating SKU metadata.
 */
const useSkuMetadata = () => {
  const dispatch = useAppDispatch();
  
  // --- Selectors ---
  const data = useAppSelector(selectSkuMetadataData);
  const loading = useAppSelector(selectSkuMetadataLoading);
  const error = useAppSelector(selectSkuMetadataError);
  const isSuccess = useAppSelector(selectSkuMetadataSuccess);
  const updatedSkuId = useAppSelector(selectUpdatedSkuMetadataId);
  
  const updateMetadata = useCallback(
    async (skuId: string, payload: UpdateSkuMetadataRequest) => {
      return dispatch(updateSkuMetadataThunk({ skuId, payload }));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetSkuMetadata());
  }, [dispatch]);
  
  return useMemo(
    () => ({
      data,
      loading,
      error,
      isSuccess,
      updatedSkuId,
      updateMetadata,
      reset,
    }),
    [data, loading, error, isSuccess, updatedSkuId, updateMetadata, reset]
  );
};

export default useSkuMetadata;
