import { useEffect } from 'react';
import { useAppSelector } from '@store/storeHooks';
import { selectIsAuthenticated } from '@features/session';
import { selectHasSelfUserProfile } from '@features/user';
import useUserSelfProfile from './useUserSelfProfile';

/**
 * useUserSelfProfileAuto
 *
 * Automatically ensures the authenticated user's profile
 * is loaded into Redux.
 *
 * Responsibilities:
 * - Trigger profile fetch when authentication becomes valid
 * - Avoid duplicate or premature fetches
 * - Remain side effect only (no returned state)
 *
 * Behavior:
 * - Does nothing while unauthenticated
 * - Fetches once after login if profile is not present
 * - Safe to call at global/layout level (e.g. AppBootstrapGate)
 *
 * Notes:
 * - This hook does NOT expose data or loading state
 * - Consumers must read profile data via selectors
 * - Must not be combined with other auto-fetch profile hooks
 */
const useUserSelfProfileAuto = (): void => {
  const { fetchSelfProfile } = useUserSelfProfile();
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasProfile = useAppSelector(
    (state) => Boolean(selectHasSelfUserProfile(state))
  );
  
  useEffect(() => {
    if (!isAuthenticated) return;
    if (hasProfile) return;
    
    fetchSelfProfile();
  }, [isAuthenticated, hasProfile, fetchSelfProfile]);
};

export default useUserSelfProfileAuto;
