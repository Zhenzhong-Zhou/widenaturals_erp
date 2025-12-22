import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLocationTypeDetailsThunk,
  selectLocations,
  selectLocationTypeDetail,
  selectLocationTypeError,
  selectLocationTypeLoading,
  selectLocationTypePagination,
} from '@features/locationType/state';

/**
 * Custom hook for fetching and managing location type details.
 * - Automatically fetches data when `id` or `page` changes.
 * - Provides a `refresh` function to manually reload data.
 * - Uses memoization for better performance.
 */
const useLocationTypeDetail = (
  id: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'created_at',
  sortOrder: string = 'ASC'
) => {
  const dispatch = useAppDispatch();

  // Selectors for Redux state
  const locationType = useAppSelector(selectLocationTypeDetail);
  const locations = useAppSelector(selectLocations);
  const pagination = useAppSelector(selectLocationTypePagination);
  const loading = useAppSelector(selectLocationTypeLoading);
  const error = useAppSelector(selectLocationTypeError);

  /**
   * Fetch location type details when `id` or `page` changes.
   */
  useEffect(() => {
    if (id) {
      dispatch(
        fetchLocationTypeDetailsThunk({ id, page, limit, sortBy, sortOrder })
      );
    }
  }, [dispatch, id, page, limit, sortBy, sortOrder]);

  /**
   * Refresh function to manually reload location type details.
   */
  const refresh = useCallback(() => {
    if (id) {
      dispatch(
        fetchLocationTypeDetailsThunk({ id, page, limit, sortBy, sortOrder })
      );
    }
  }, [dispatch, id, page, limit, sortBy, sortOrder]);

  /**
   * Memoizing returned values to prevent unnecessary re-renders.
   */
  return useMemo(
    () => ({
      locationType,
      locations,
      pagination,
      loading,
      error,
      refresh, // Exposed refresh function
    }),
    [locationType, locations, pagination, loading, error, refresh]
  );
};

export default useLocationTypeDetail;
