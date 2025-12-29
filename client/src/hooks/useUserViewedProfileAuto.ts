import { useEffect } from 'react';
import useUserViewedProfile from './useUserViewedProfile';

/**
 * Automatically fetches a viewed user's profile when `userId` is available.
 *
 * This hook triggers a profile fetch whenever the provided `userId` changes.
 * It is intended for route-driven HR/Admin profile pages.
 *
 * Notes:
 * - No fetch occurs when `userId` is null
 * - Triggers on initial mount and on `userId` change
 * - Does not expose state or return values
 * - Should not be used together with self-profile auto-fetch hooks
 */
const useUserViewedProfileAuto = (userId: string | null) => {
  const { fetchViewedProfile } = useUserViewedProfile();
  
  useEffect(() => {
    if (!userId) return;
    fetchViewedProfile(userId);
  }, [userId, fetchViewedProfile]);
};

export default useUserViewedProfileAuto;
