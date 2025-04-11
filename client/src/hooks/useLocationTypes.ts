import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectLocationTypes,
  selectLocationTypesPagination,
  selectLocationTypesLoading,
  selectLocationTypesError,
  fetchLocationTypesThunk,
} from '@features/locationType/state';

/**
 * Custom hook for fetching and managing location types.
 */
const useLocationTypes = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const locationTypes = useAppSelector(selectLocationTypes);
  const pagination = useAppSelector(selectLocationTypesPagination);
  const loading = useAppSelector(selectLocationTypesLoading);
  const error = useAppSelector(selectLocationTypesError);

  /**
   * Fetch location types with pagination.
   * @param page - The current page number.
   * @param limit - The number of records per page.
   */
  const fetchLocations = useCallback(
    (page: number, limit: number) => {
      if (page < 1) return; // Prevent invalid page numbers

      try {
        dispatch(fetchLocationTypesThunk({ page, limit })).unwrap();
      } catch (err) {
        console.error('Failed to fetch location types:', err);
      }
    },
    [dispatch]
  );

  // Fetch on initial render only if no location types exist
  useEffect(() => {
    if (locationTypes.length === 0) {
      fetchLocations(pagination.page, pagination.limit);
    }
  }, [fetchLocations, locationTypes.length, pagination.page, pagination.limit]);

  return {
    locationTypes,
    pagination,
    loading,
    error,
    fetchLocations,
  };
};

export default useLocationTypes;
