import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { fetchUserProfileThunk } from '../features/user/state/userThunks';
import { selectUserError, selectUserLoading, selectUserProfile } from '../features/user/state/userSelectors';

/**
 * Custom hook to fetch and manage the user profile.
 *
 * @returns {{ user: Object | null, loading: boolean, error: string | null }}
 */
const useUserProfile = (): { user: object | null; loading: boolean; error: string | null; } => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const user = useAppSelector(selectUserProfile);
  const loading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  
  // todo fix this bug
  // Dispatch profile fetch
  useEffect(() => {
    if (!user && !loading) {
      dispatch(fetchUserProfileThunk())
        .unwrap()
        .catch((err) => {
          console.error('Immediate error during fetch:', err);
          // Handle API-specific issues or debug
        });
    }
  // }, [dispatch, user, loading]);
  }, [dispatch]);
  
  // Log errors if any
  // useEffect(() => {
  //   if (error) {
  //     console.error('Failed to fetch user profile:', error);
  //     // Optionally show a notification here
  //   }
  // }, [error]);
  
  // Memoize the result to prevent unnecessary re-renders
  return useMemo(
    () => ({ user, loading, error }),
    [user, loading, error]
  );
};

export default useUserProfile;
