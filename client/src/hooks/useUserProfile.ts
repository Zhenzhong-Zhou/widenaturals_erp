import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type {
  UserProfileResponse,
} from '@features/user/state';
import {
  fetchUserProfileThunk,
  selectUserProfileData,
} from '@features/user/state';

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

  // Use the memoized selector
  const {
    response: userResponse,
    loading,
    error,
  } = useAppSelector(selectUserProfileData);

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
