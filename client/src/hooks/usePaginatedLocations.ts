import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { LocationListQueryParams } from '@features/location';
import {
  selectPaginatedLocationData,
  selectPaginatedLocationPagination,
  selectPaginatedLocationLoading,
  selectPaginatedLocationError,
  selectPaginatedLocationIsEmpty,
  fetchPaginatedLocationThunk,
  makeSelectLocationById,
} from '@features/location';
import { resetPaginatedLocations } from '@features/location/state/paginatedLocationsSlice';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/* ============================================================
   usePaginatedLocations
   ============================================================ */

/**
 * usePaginatedLocations
 *
 * Returns paginated location data that is already flattened
 * and UI-ready. No additional transformation is required
 * at the hook or component level.
 *
 * Responsibilities:
 * - Exposes flattened location rows from Redux state
 * - Provides pagination, loading, and error state
 * - Encapsulates fetch/reset actions for the location list
 *
 * Design notes:
 * - Data returned from this hook is presentation-ready
 * - Consumers MUST NOT re-flatten records
 * - Fetching is explicit (no implicit side effects)
 */
export const usePaginatedLocations = () => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedLocationData);
  const pagination = useAppSelector(selectPaginatedLocationPagination);
  const loading = useAppSelector(selectPaginatedLocationLoading);
  const error = useAppSelector(selectPaginatedLocationError);
  const isEmpty = useAppSelector(selectPaginatedLocationIsEmpty);

  // ---------------------------
  // Actions
  // ---------------------------

  /**
   * Fetch paginated locations using Redux thunk.
   *
   * Parameters may include pagination, sorting, and filtering.
   */
  const fetchLocations = useCallback(
    (params: LocationListQueryParams) => {
      dispatch(fetchPaginatedLocationThunk(params));
    },
    [dispatch]
  );

  /**
   * Reset paginated location state back to initial empty form.
   */
  const resetLocations = useCallback(() => {
    dispatch(resetPaginatedLocations());
  }, [dispatch]);

  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(() => normalizePagination(pagination), [pagination]);

  return {
    data,
    pagination,
    loading,
    error,
    isEmpty,

    pageInfo, // { page, limit }

    fetchLocations,
    resetLocations,
  };
};

/* ============================================================
   useLocationById
   ============================================================ */

/**
 * useLocationById
 *
 * Returns a single flattened location row by ID.
 *
 * Intended for:
 * - expanded table rows
 * - detail drawers
 * - side panels
 */
export const useLocationById = (id: string) => {
  const selector = useMemo(() => makeSelectLocationById(), []);

  return useAppSelector((state) => selector(state, id));
};
