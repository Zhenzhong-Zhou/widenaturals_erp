import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuIdentityData,
  selectSkuIdentityLoading,
  selectSkuIdentityError,
  selectSkuIdentitySuccess,
  selectUpdatedSkuIdentityId,
  updateSkuIdentityThunk,
} from '@features/sku/state';
import type { UpdateSkuIdentityRequest } from '@features/sku/state';
import { resetSkuIdentity } from '@features/sku/state/skuIdentitySlice';

/**
 * Hook providing a clean interface for updating SKU identity.
 */
const useSkuIdentity = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectSkuIdentityData);
  const loading = useAppSelector(selectSkuIdentityLoading);
  const error = useAppSelector(selectSkuIdentityError);
  const isSuccess = useAppSelector(selectSkuIdentitySuccess);
  const updatedSkuId = useAppSelector(selectUpdatedSkuIdentityId);
  
  const updateIdentity = useCallback(
    async (skuId: string, payload: UpdateSkuIdentityRequest) => {
      return dispatch(updateSkuIdentityThunk({ skuId, payload }));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetSkuIdentity());
  }, [dispatch]);
  
  return useMemo(
    () => ({
      data,
      loading,
      error,
      isSuccess,
      updatedSkuId,
      updateIdentity,
      reset,
    }),
    [data, loading, error, isSuccess, updatedSkuId, updateIdentity, reset]
  );
};

export default useSkuIdentity;
