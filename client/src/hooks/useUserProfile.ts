import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { fetchUserProfileThunk } from '../features/user/state/userThunks';
import {
  selectUserProfileError,
  selectUserProfileLoading,
  selectUserProfileResponse,
} from '../features/user/state/userProfileSelectors.ts';
import { UserResponse } from '../features/user/state/userTypes.ts';

/**
 * Custom hook to fetch and manage the user profile.
 *
 * @returns {UserResponse & { loading: boolean; error: string | null }}
 */
const useUserProfile = (): UserResponse & { loading: boolean; error: string | null } => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const userResponse = useAppSelector<UserResponse | null>(selectUserProfileResponse);
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
  const defaultResponse: UserResponse = {
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
