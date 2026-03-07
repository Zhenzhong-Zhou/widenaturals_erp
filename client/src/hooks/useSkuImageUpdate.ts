import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuImageUpdateLoading,
  selectSkuImageUpdateError,
  selectSkuImageUpdateData,
  selectSkuImageUpdateStats,
  selectSkuImageUpdateResults,
  selectSkuImageUpdateSucceededCount,
  selectSkuImageUpdateFailedCount,
  selectSkuImageUpdateHasResults,
  selectSkuImageUpdateSuccess,
  updateSkuImagesThunk,
} from '@features/skuImage/state';
import { resetSkuImageUpdate } from '@features/skuImage/state/skuImageUpdateSlice';

const useSkuImageUpdate = () => {
  const dispatch = useAppDispatch();

  // Primitive selectors (memoized via RTK createSelector)
  const loading = useAppSelector(selectSkuImageUpdateLoading);
  const error = useAppSelector(selectSkuImageUpdateError);
  const data = useAppSelector(selectSkuImageUpdateData);
  const stats = useAppSelector(selectSkuImageUpdateStats);
  const results = useAppSelector(selectSkuImageUpdateResults);
  const succeededCount = useAppSelector(selectSkuImageUpdateSucceededCount);
  const failedCount = useAppSelector(selectSkuImageUpdateFailedCount);
  const hasResults = useAppSelector(selectSkuImageUpdateHasResults);
  const isSuccess = useAppSelector(selectSkuImageUpdateSuccess);

  // Stable update function
  const updateImages = useCallback(
    async (formData: FormData) => {
      return dispatch(updateSkuImagesThunk(formData)).unwrap();
    },
    [dispatch]
  );

  // Stable reset function
  const reset = useCallback(() => {
    dispatch(resetSkuImageUpdate());
  }, [dispatch]);

  // Grouped memoized return object (stable reference)
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

  return {
    ...state,
    updateImages,
    reset,
  };
};

export default useSkuImageUpdate;
