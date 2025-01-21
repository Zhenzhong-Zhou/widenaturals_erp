import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { fetchUserProfileThunk } from '../features/user/state/userThunks';
import { selectUserError, selectUserLoading, selectUserProfile } from '../features/user/state/userSelectors';

const useUserProfile = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const user = useAppSelector(selectUserProfile);
  const loading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  
  // Dispatch profile fetch only if not loading and user data is missing
  useEffect(() => {
    if (!user && !loading) {
      dispatch(fetchUserProfileThunk())
        .catch((err) => console.error('Thunk failed:', err)); // Handle any unhandled rejections
    }
  }, [dispatch, user, loading]);
  
  // Log errors if any
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch user profile:', error);
      // Optionally show a notification here
    }
  }, [error]);
  
  // Memoize the result to prevent unnecessary re-renders
  return useMemo(
    () => ({ user, loading, error }),
    [user, loading, error]
  );
};

export default useUserProfile;
