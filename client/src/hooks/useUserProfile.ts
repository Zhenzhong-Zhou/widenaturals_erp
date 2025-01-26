import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { fetchUserProfileThunk } from '../features/user/state/userThunks';
import {
  selectUserProfileError,
  selectUserProfileLoading,
  selectUserProfileResponse,
} from '../features/user/state/userProfileSelectors.ts';
import { UserProfileResponse } from '../features/user/state/userTypes.ts';

/**
 * Custom hook to fetch and manage the user profile.
 *
 * @returns {UserProfileResponse & { loading: boolean; error: string | null }}
 */
const useUserProfile = (): UserProfileResponse & {
  loading: boolean;
  error: string | null;
} => {
  const dispatch = useAppDispatch();

  // Selectors
  const userResponse = useAppSelector<UserProfileResponse | null>(
    selectUserProfileResponse
  );
  const loading = useAppSelector(selectUserProfileLoading);
  const error = useAppSelector(selectUserProfileError);

  // Dispatch profile fetch
  useEffect(() => {
    if (!userResponse && !loading) {
      dispatch(fetchUserProfileThunk())
        .unwrap()
        .catch((err) => {
          console.error('Immediate error during fetch:', err);
          // Handle API-specific issues or debug
        });
    }
  }, [dispatch, userResponse, loading]);
  // }, [dispatch]);

  // Log errors if any
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch user profile:', error);
      // Optionally show a notification here
    }
  }, [error]);

  // Default response structure
  const defaultResponse: UserProfileResponse = {
    success: false,
    message: '',
    data: {
      email: '',
      role: '',
      firstname: '',
      lastname: '',
      phone_number: null,
      job_title: '',
      created_at: '',
      updated_at: '',
    },
    timestamp: '',
  };

  return {
    ...defaultResponse,
    ...userResponse,
    loading,
    error,
  };
};

export default useUserProfile;
