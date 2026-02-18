import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { LocationTypeListQueryParams } from '@features/locationType';
import {
  selectPaginatedLocationTypeData,
  selectPaginatedLocationTypePagination,
  selectPaginatedLocationTypeLoading,
  selectPaginatedLocationTypeError,
  selectPaginatedLocationTypeIsEmpty,
  fetchPaginatedLocationTypeThunk,
  makeSelectLocationTypeById,
} from '@features/locationType';
import { resetPaginatedLocationTypes } from '@features/locationType/state/paginatedLocationTypesSlice';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/* ============================================================
   usePaginatedLocationTypes
   ============================================================ */

/**
 * usePaginatedLocationTypes
 *
 * Returns paginated location type data that is already flattened
 * and UI-ready. No additional transformation is required
 * at the hook or component level.
 *
 * Responsibilities:
 * - Exposes flattened location type rows from Redux state
 * - Provides pagination, loading, and error state
 * - Encapsulates fetch/reset actions for the location type list
 *
 * Design notes:
 * - Data returned from this hook is presentation-ready
 * - Consumers MUST NOT re-flatten records
 * - Fetching is explicit (no implicit side effects)
 */
export const usePaginatedLocationTypes = () => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedLocationTypeData);
  const pagination = useAppSelector(selectPaginatedLocationTypePagination);
  const loading = useAppSelector(selectPaginatedLocationTypeLoading);
  const error = useAppSelector(selectPaginatedLocationTypeError);
  const isEmpty = useAppSelector(selectPaginatedLocationTypeIsEmpty);

  // ---------------------------
  // Actions
  // ---------------------------

  /**
   * Fetch paginated location types using Redux thunk.
   *
   * Parameters may include pagination, sorting, and filtering.
   */
  const fetchLocationTypes = useCallback(
    (params: LocationTypeListQueryParams) => {
      dispatch(fetchPaginatedLocationTypeThunk(params));
    },
    [dispatch]
  );

  /**
   * Reset paginated location type state back to initial empty form.
   */
  const resetLocationTypes = useCallback(() => {
    dispatch(resetPaginatedLocationTypes());
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

    fetchLocationTypes,
    resetLocationTypes,
  };
};

/* ============================================================
   useLocationTypeById
   ============================================================ */

/**
 * useLocationTypeById
 *
 * Returns a single flattened location type row by ID.
 *
 * Intended for:
 * - expanded table rows
 * - detail drawers
 * - side panels
 */
export const useLocationTypeById = (id: string | null) => {
  const selector = useMemo(() => makeSelectLocationTypeById(), []);
  return useAppSelector((state) => (id ? selector(state, id) : null));
};
