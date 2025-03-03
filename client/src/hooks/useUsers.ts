import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectUsers,
  selectUsersError,
  selectUsersLoading,
} from '../features/user/state/userSelectors.ts';
import { fetchUsersThunk } from '../features/user/state/userThunks.ts';
import { UseUsersResponse } from '../features/user/state/userTypes.ts';

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
  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectUsersLoading);
  const error = useAppSelector(selectUsersError);
  const [paginationState, setPaginationState] = useState({
    page: 1,
    limit: 10,
    sortBy: 'u.created_at',
    sortOrder: 'ASC',
  });

  useEffect(() => {
    // Fetch users whenever pagination or sorting parameters change
    dispatch(fetchUsersThunk(paginationState))
      .unwrap()
      .catch((err) => {
        console.error('Failed to fetch users:', err);
      });
  }, [dispatch, paginationState]);

  // Expose a manual refetch function
  const refetchUsers = async (options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    try {
      // Merge new options into the existing paginationState
      setPaginationState((prev) => ({ ...prev, ...options }));
    } catch (err) {
      console.error('Failed to refetch users:', err);
    }
  };

  return { users, loading, error, refetchUsers };
};

export default useUsers;
