import { useCallback } from 'react';
import { useAppDispatch } from '@store/storeHooks';
import { logoutThunk } from '@features/session/state/sessionThunks';

/**
 * Hook for logging the user out.
 *
 * Responsibilities:
 * - Trigger logout thunk (server + client cleanup)
 * - Redirect to login page
 *
 * Notes:
 * - No token clearing here
 * - No storage manipulation here
 * - No local loading/error state
 */
const useLogout = () => {
  const dispatch = useAppDispatch();
  
  const logout = useCallback(async (): Promise<void> => {
    try {
      await dispatch(logoutThunk()).unwrap();
    } finally {
      /**
       * Always redirect after logout.
       * Client session is already destroyed by the thunk.
       */
      window.location.href = '/login';
    }
  }, [dispatch]);
  
  return { logout };
};

export default useLogout;
