import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectUserViewedProfile,
  selectUserViewedProfileLoading,
  selectUserViewedProfileError,
  selectIsViewedProfileLoadingEmpty,
  selectViewedUserFullName,
  selectViewedUserEmail,
  selectIsViewedSystemUser,
  selectViewedUserId,
  fetchUserViewedProfileThunk,
  resetUserViewedProfile,
} from '@features/user';

/**
 * Hook: Access and control a viewed user's profile (HR/Admin).
 *
 * Used by:
 * - HR user profile pages
 * - Admin inspection views
 */
const useUserViewedProfile = () => {
  const dispatch = useAppDispatch();
  
  // ----------------------------
  // Selectors
  // ----------------------------
  
  const profile = useAppSelector(selectUserViewedProfile);
  const loading = useAppSelector(selectUserViewedProfileLoading);
  const error = useAppSelector(selectUserViewedProfileError);
  const viewedUserId = useAppSelector(selectViewedUserId);
  
  const fullName = useAppSelector(selectViewedUserFullName);
  const email = useAppSelector(selectViewedUserEmail);
  const isSystem = useAppSelector(selectIsViewedSystemUser);
  const isLoadingEmpty = useAppSelector(selectIsViewedProfileLoadingEmpty);
  
  // ----------------------------
  // Actions
  // ----------------------------
  
  const fetchViewedProfile = useCallback(
    (userId: string) => {
      dispatch(fetchUserViewedProfileThunk(userId));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetUserViewedProfile());
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
      viewedUserId,
    }),
    [profile, fullName, email, isSystem, viewedUserId]
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
    fetchViewedProfile,
    reset,
  };
};

export default useUserViewedProfile;
