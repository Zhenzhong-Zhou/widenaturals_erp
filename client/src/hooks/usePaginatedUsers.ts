import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type {
  GetPaginatedUsersParams,
  UserViewMode,
} from '@features/user/state';
import {
  selectPaginatedUsersData,
  selectPaginatedUsersPagination,
  selectPaginatedUsersLoading,
  selectPaginatedUsersError,
  selectPaginatedUsersIsEmpty,
  fetchPaginatedUsersThunk,
} from '@features/user/state';
import { resetPaginatedUsers } from '@features/user/state/paginatedUsersSlice';

type FetchUsersParams =
  GetPaginatedUsersParams & { viewMode?: UserViewMode };

/**
 * React hook for accessing paginated users state and actions.
 *
 * Provides:
 * - user list data (card or list shape, depending on query)
 * - loading and error states
 * - pagination metadata
 * - actions to fetch and reset data
 *
 * Recommended for:
 * - user list pages
 * - user tables
 * - card/list toggle layouts
 */
const usePaginatedUsers = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedUsersData);
  const pagination = useAppSelector(selectPaginatedUsersPagination);
  const loading = useAppSelector(selectPaginatedUsersLoading);
  const error = useAppSelector(selectPaginatedUsersError);
  const isEmpty = useAppSelector(selectPaginatedUsersIsEmpty);
  
  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated users using Redux thunk.
   *
   * Parameters may include pagination, sorting, filtering,
   * and an optional view mode (`card` or `list`).
   */
  const fetchUsers = useCallback(
    (params: FetchUsersParams) => {
      dispatch(fetchPaginatedUsersThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset paginated users state back to the initial empty form.
   *
   * Typically used when:
   * - leaving the users page
   * - switching modules
   * - performing a full filter reset
   */
  const resetUsers = useCallback(() => {
    dispatch(resetPaginatedUsers());
  }, [dispatch]);
  
  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      totalRecords: pagination.totalRecords,
    }),
    [pagination]
  );
  
  return {
    data,
    pagination,
    loading,
    error,
    isEmpty,
    
    pageInfo, // { page, limit }
    
    fetchUsers,
    resetUsers,
  };
};

export default usePaginatedUsers;
