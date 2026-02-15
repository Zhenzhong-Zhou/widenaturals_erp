import { useMemo } from 'react';
import { useAppSelector } from '@store/storeHooks';
import {
  selectAccessToken,
  selectIsAuthenticated,
  selectSessionBootstrapped,
  selectSessionResolving,
} from '@features/session/state/sessionSelectors';

/**
 * useSession
 *
 * Canonical read-only hook for client-side session state.
 *
 * Responsibilities:
 * - Expose authentication status derived from session state
 * - Expose session bootstrap and resolution lifecycle flags
 * - Expose the in-memory access token for system-level consumers
 *
 * Explicitly out of scope:
 * - Mutating session state
 * - Triggering authentication or refresh side effects
 * - Performing routing or permission logic
 *
 * Notes:
 * - This hook MUST be the only mechanism for reading session state
 * - Route guards, layouts, and bootstrap logic should depend on this hook
 * - Consumers must tolerate transient states during bootstrap
 */
const useSession = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const resolving = useAppSelector(selectSessionResolving);
  const bootstrapped = useAppSelector(selectSessionBootstrapped);
  const accessToken = useAppSelector(selectAccessToken);

  return useMemo(
    () => ({
      isAuthenticated,
      resolving,
      bootstrapped,
      accessToken,
    }),
    [isAuthenticated, resolving, bootstrapped, accessToken]
  );
};

export default useSession;
