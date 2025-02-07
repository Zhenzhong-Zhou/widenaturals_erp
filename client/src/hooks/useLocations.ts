import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectLocationError,
  selectLocationLoading,
  selectLocationPagination,
  selectLocations,
  fetchAllLocations,
} from '../features/location';

/**
 * Custom hook for fetching and managing locations.
 */
const useLocations = (page: number, limit: number) => {
  const dispatch = useAppDispatch();
  
  // Selectors with memoization
  const locations = useAppSelector(selectLocations);
  const pagination = useAppSelector(selectLocationPagination);
  const loading = useAppSelector(selectLocationLoading);
  const error = useAppSelector(selectLocationError);
  
  /**
   * Fetch locations when `page` or `limit` changes.
   */
  useEffect(() => {
    dispatch(fetchAllLocations({ page, limit }));
  }, [dispatch, page, limit]);
  
  /**
   * Function to manually refresh location data.
   */
  const refresh = useCallback(() => {
    dispatch(fetchAllLocations({ page, limit }));
  }, [dispatch, page, limit]);
  
  /**
   * Memoized return values to prevent unnecessary re-renders.
   */
  return useMemo(() => ({
    locations,
    pagination,
    loading,
    error,
    refresh, // Exposed refresh function
  }), [locations, pagination, loading, error, page, limit, refresh]);
};

export default useLocations;
