import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectUserSelfProfile,
  selectUserSelfProfileLoading,
  selectUserSelfProfileError,
  selectIsSelfProfileLoadingEmpty,
  selectSelfUserFullName,
  selectSelfUserEmail,
  selectIsSelfSystemUser,
  fetchUserSelfProfileThunk,
  resetUserSelfProfile,
} from '@features/user';

/**
 * Hook: Access and control the logged-in user's profile state.
 *
 * Used by:
 * - MainLayout
 * - "My Profile" page
 */
const useUserSelfProfile = () => {
  const dispatch = useAppDispatch();
  
  // ----------------------------
  // Selectors
  // ----------------------------
  
  const profile = useAppSelector(selectUserSelfProfile);
  const loading = useAppSelector(selectUserSelfProfileLoading);
  const error = useAppSelector(selectUserSelfProfileError);
  
  const fullName = useAppSelector(selectSelfUserFullName);
  const email = useAppSelector(selectSelfUserEmail);
  const isSystem = useAppSelector(selectIsSelfSystemUser);
  const isLoadingEmpty = useAppSelector(selectIsSelfProfileLoadingEmpty);
  
  // ----------------------------
  // Actions
  // ----------------------------
  
  const fetchSelfProfile = useCallback(() => {
    dispatch(fetchUserSelfProfileThunk());
  }, [dispatch]);
  
  const reset = useCallback(() => {
    dispatch(resetUserSelfProfile());
  }, [dispatch]);
  
  // ----------------------------
  // Memoized shape
  // ----------------------------
  
  const combined = useMemo(
    () => ({
      profile,
      fullName,
      email,
      isSystem,
    }),
    [profile, fullName, email, isSystem]
  );
  
  // ----------------------------
  // Public API
  // ----------------------------
  
  return {
    // state
    ...combined,
    loading,
    error,
    isLoadingEmpty,
    
    // actions
    fetchSelfProfile,
    reset,
  };
};

export default useUserSelfProfile;
