import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { selectUsers, selectUsersError, selectUsersLoading } from '../features/user/state/userSelectors.ts';
import { fetchUsersThunk } from '../features/user/state/userThunks.ts';

/**
 * Custom hook to manage fetching users and accessing user state.
 *
 * @returns {object} - Contains users, loading, error, and a refetch function.
 */
const useUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectUsersLoading);
  const error = useAppSelector(selectUsersError);
  
  // Fetch users on mount
  useEffect(() => {
    dispatch(fetchUsersThunk()).unwrap();
  }, [dispatch]);
  
  // Expose a manual refetch function
  const refetchUsers = () => {
    dispatch(fetchUsersThunk());
  };
  
  return { users, loading, error, refetchUsers };
};

export default useUsers;