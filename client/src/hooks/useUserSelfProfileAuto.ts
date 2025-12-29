import { useEffect } from 'react';
import useUserSelfProfile from './useUserSelfProfile';

/**
 * Automatically fetches the authenticated user's profile on mount.
 *
 * This hook is a thin convenience wrapper around `useUserSelfProfile`
 * and is intended for pages where the self profile should be loaded
 * immediately without manual triggers.
 *
 * Notes:
 * - Performs a single fetch on mount
 * - Does not expose state or return values
 * - Should not be combined with other auto-fetch profile hooks
 */
const useUserSelfProfileAuto = () => {
  const { fetchSelfProfile } = useUserSelfProfile();
  
  useEffect(() => {
    fetchSelfProfile();
  }, [fetchSelfProfile]);
};

export default useUserSelfProfileAuto;
