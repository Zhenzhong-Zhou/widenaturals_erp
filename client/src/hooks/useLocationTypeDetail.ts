import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectLocationTypeDetailData,
  selectLocationTypeDetailLoading,
  selectLocationTypeDetailError,
  selectLocationTypeDetailIsEmpty,
} from '@features/locationType/state';
import {
  fetchLocationTypeDetailsThunk,
} from '@features/locationType/state';
import {
  resetLocationTypeDetail,
} from '@features/locationType/state/locationTypeDetailSlice';

/**
 * Hook: Provides typed selectors and dispatchable actions
 * for interacting with Location Type Detail state.
 *
 * Includes:
 * - Memoized read selectors (`useAppSelector`)
 * - Memoized dispatchable actions (`useCallback`)
 * - Structured return API for clean component integration
 *
 * Note:
 * - traceId is intentionally excluded from this hook.
 */
const useLocationTypeDetail = () => {
  const dispatch = useAppDispatch();
  
  // ----------------------------
  // Selectors
  // ----------------------------
  
  const locationType = useAppSelector(selectLocationTypeDetailData);
  const loading = useAppSelector(selectLocationTypeDetailLoading);
  const error = useAppSelector(selectLocationTypeDetailError);
  const isEmpty = useAppSelector(selectLocationTypeDetailIsEmpty);
  
  // ----------------------------
  // Actions
  // ----------------------------
  
  /**
   * Fetch Location Type detail by ID (dispatch thunk).
   */
  const fetchLocationTypeDetail = useCallback(
    (locationTypeId: string) => {
      if (!locationTypeId?.trim()) return;
      dispatch(fetchLocationTypeDetailsThunk(locationTypeId));
    },
    [dispatch]
  );
  
  /**
   * Reset Location Type detail slice state (useful on unmount).
   */
  const resetLocationTypeDetailState = useCallback(() => {
    dispatch(resetLocationTypeDetail());
  }, [dispatch]);
  
  // ----------------------------
  // Memoized combined result
  // ----------------------------
  
  const combined = useMemo(
    () => ({
      locationType,
      isEmpty,
    }),
    [locationType, isEmpty]
  );
  
  // ----------------------------
  // Hook Return API
  // ----------------------------
  
  return {
    // combined state
    ...combined,
    
    // simple state flags
    loading,
    error,
    
    // actions
    fetchLocationTypeDetail,
    resetLocationTypeDetailState,
  };
};

export default useLocationTypeDetail;
