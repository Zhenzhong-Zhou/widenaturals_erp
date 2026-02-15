import { useEffect } from 'react';
import { useAppSelector } from '@store/storeHooks';
import {
  selectIsAuthenticated,
  selectSessionResolving,
} from '@features/session/state/sessionSelectors';
import { selectHasSelfUserProfile } from '@features/user';
import useUserSelfProfile from './useUserSelfProfile';

/**
 * useUserSelfProfileAuto
 *
 * Lifecycle hook that automatically ensures the authenticated
 * user's own profile is loaded into client state.
 *
 * Responsibilities:
 * - Trigger self-profile fetch once authentication is confirmed
 * - Defer execution until session resolution completes
 * - Prevent duplicate profile fetches
 *
 * Explicitly out of scope:
 * - Authentication or session bootstrap logic
 * - Profile mutation or refresh semantics
 * - Error handling or retry policies
 *
 * Notes:
 * - This hook is intentionally side-effect–only and returns no value
 * - It is safe to mount globally (e.g., in layouts or root components)
 * - Profile loading is skipped for unauthenticated users
 */
const useUserSelfProfileAuto = (): void => {
  const { fetchSelfProfile } = useUserSelfProfile();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const resolving = useAppSelector(selectSessionResolving);
  const hasProfile = useAppSelector(selectHasSelfUserProfile);

  useEffect(() => {
    // Wait for session bootstrap to complete
    if (resolving) return;

    // Only fetch for authenticated users
    if (!isAuthenticated) return;

    // Avoid duplicate fetches
    if (hasProfile) return;

    fetchSelfProfile();
  }, [resolving, isAuthenticated, hasProfile, fetchSelfProfile]);
};

export default useUserSelfProfileAuto;
