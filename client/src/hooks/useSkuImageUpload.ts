import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuImageUploadLoading,
  selectSkuImageUploadError,
  selectSkuImageUploadData,
  selectSkuImageUploadStats,
  selectSkuImageUploadResults,
  selectSkuImageUploadSucceededCount,
  selectSkuImageUploadFailedCount,
  selectSkuImageUploadHasResults,
  BulkSkuImageUploadRequest,
  uploadSkuImagesThunk,
} from '@features/skuImage/state';
import { resetUploadState } from '@features/skuImage/state/skuImageUploadSlice';

const useSkuImageUpload = () => {
  const dispatch = useAppDispatch();
  
  // Primitive selectors (memoized via RTK's createSelector)
  const loading = useAppSelector(selectSkuImageUploadLoading);
  const error = useAppSelector(selectSkuImageUploadError);
  const data = useAppSelector(selectSkuImageUploadData);
  const stats = useAppSelector(selectSkuImageUploadStats);
  const results = useAppSelector(selectSkuImageUploadResults);
  const succeededCount = useAppSelector(selectSkuImageUploadSucceededCount);
  const failedCount = useAppSelector(selectSkuImageUploadFailedCount);
  const hasResults = useAppSelector(selectSkuImageUploadHasResults);
  
  // Stable upload function
  const uploadImages = useCallback(
    async (payload: BulkSkuImageUploadRequest) => {
      return dispatch(uploadSkuImagesThunk(payload));
    },
    [dispatch]
  );
  
  // Stable reset function
  const reset = useCallback(() => {
    dispatch(resetUploadState());
  }, [dispatch]);
  
  // Grouped memoized return object (stable reference for components)
  const state = useMemo(
    () => ({
      loading,
      error,
      data,
      stats,
      results,
      hasResults,
      succeededCount,
      failedCount
    }),
    [
      loading,
      error,
      data,
      stats,
      results,
      hasResults,
      succeededCount,
      failedCount
    ]
  );
  
  // Expose actions + memoized state
  return {
    ...state,
    uploadImages,
    reset
  };
};

export default useSkuImageUpload;
