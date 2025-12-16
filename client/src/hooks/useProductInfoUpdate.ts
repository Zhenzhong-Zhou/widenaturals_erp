import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectProductInfoUpdateData,
  selectProductInfoUpdateLoading,
  selectProductInfoUpdateError,
  selectProductInfoUpdateSuccess,
  selectUpdatedProductInfoId,
  ProductUpdateRequest,
  updateProductInfoByIdThunk,
} from '@features/product/state';
import { resetProductInfoUpdateState } from '@features/product/state/productInfoUpdateSlice';

export interface UpdateProductInfoThunkArgs {
  productId: string;
  payload: ProductUpdateRequest;
}

/**
 * Hook providing a clean interface for updating product information.
 *
 * Exposes:
 *  - updateInfo: dispatch the updateProductInfoByIdThunk
 *  - reset: reset the slice state
 *  - loading, error, isSuccess
 *  - data: API response envelope
 *  - updatedProductId: ID of the updated product
 */
const useProductInfoUpdate = () => {
  const dispatch = useAppDispatch();
  
  // --- Selectors ---
  const data = useAppSelector(selectProductInfoUpdateData);
  const loading = useAppSelector(selectProductInfoUpdateLoading);
  const error = useAppSelector(selectProductInfoUpdateError);
  const isSuccess = useAppSelector(selectProductInfoUpdateSuccess);
  const updatedProductId = useAppSelector(selectUpdatedProductInfoId);
  
  // --- Action: Update product info ---
  const updateInfo = useCallback(
    async (args: UpdateProductInfoThunkArgs) => {
      return dispatch(updateProductInfoByIdThunk(args));
    },
    [dispatch]
  );
  
  // --- Action: Reset slice ---
  const reset = useCallback(() => {
    dispatch(resetProductInfoUpdateState());
  }, [dispatch]);
  
  // --- Public API ---
  return useMemo(
    () => ({
      data,
      loading,
      error,
      isSuccess,
      updatedProductId,
      
      updateInfo,
      reset,
    }),
    [
      data,
      loading,
      error,
      isSuccess,
      updatedProductId,
      updateInfo,
      reset,
    ]
  );
};

export default useProductInfoUpdate;
