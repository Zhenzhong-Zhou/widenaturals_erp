import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { selectUsersData } from '../features/user/state/userSelectors.ts';
import { fetchUsersThunk, UseUsersResponse } from '../features/user';

/**
 * Custom hook to manage fetching users and accessing user state.
 *
 * @returns {object} - Contains users, loading, error, and a refetch function.
 */
const useUsers = (): {
  users: UseUsersResponse;
  loading: boolean;
  error: string | null;
  refetchUsers: (options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => void;
} => {
  const dispatch = useAppDispatch();
  
  // Use the memoized selector
  const { users, loading, error } = useAppSelector(selectUsersData);
  
  const [paginationState, setPaginationState] = useState({
    page: 1,
    limit: 10,
    sortBy: 'u.created_at',
    sortOrder: 'ASC',
  });
  
  useEffect(() => {
    dispatch(fetchUsersThunk(paginationState))
      .unwrap()
      .catch((err) => {
        console.error('Failed to fetch users:', err);
      });
  }, [dispatch, paginationState]);
  
  // Expose a manual refetch function
  const refetchUsers = (options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setPaginationState((prev) => ({ ...prev, ...options }));
  };
  
  return { users, loading, error, refetchUsers };
};

export default useUsers;
