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
  uploadSkuImagesThunk,
  selectSkuImageUploadSuccess,
  resetSkuImageUpload,
} from '@features/skuImage/state';

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
  const isSuccess = useAppSelector(selectSkuImageUploadSuccess);
  
  // Stable upload function
  const uploadImages = useCallback(
    async (formData: FormData) => {
      return dispatch(uploadSkuImagesThunk(formData));
    },
    [dispatch]
  );
  
  // Stable reset function
  const reset = useCallback(() => {
    dispatch(resetSkuImageUpload());
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
      failedCount,
      isSuccess,
    }),
    [
      loading,
      error,
      data,
      stats,
      results,
      hasResults,
      succeededCount,
      failedCount,
      isSuccess,
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
