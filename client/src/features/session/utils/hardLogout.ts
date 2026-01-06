import { store } from '@store/store';
import { resetSession } from '@features/session/state/sessionSlice';
import { resetLogin } from '@features/session/state/loginSlice';
import { persistor } from '@store/store';

let isLoggingOut = false;

/**
 * Performs a hard, irreversible logout.
 *
 * Responsibilities:
 * - Clears all in-memory authentication and session-related Redux state
 * - Purges all persisted authentication/session data
 * - Forces a full page navigation to the login route
 *
 * Intended usage:
 * - Refresh token failure (unrecoverable authentication state)
 * - Server-side session invalidation or revocation
 * - Permission loss that cannot be reconciled locally
 *
 * Characteristics:
 * - Idempotent: safe to call multiple times concurrently
 * - Transport-safe: callable from Axios interceptors and non-React contexts
 * - UI-agnostic: intentionally bypasses React Router
 *
 * Notes:
 * - Uses `window.location.replace` to prevent back navigation
 * - Triggers a full reload to guarantee a clean application state
 */
export const hardLogout = async (): Promise<void> => {
  if (isLoggingOut) return;
  isLoggingOut = true;
  
  // Reset volatile Redux auth/session state
  store.dispatch(resetSession());
  store.dispatch(resetLogin());
  
  // Ensure persisted auth data is fully removed
  await persistor.purge();
  
  // Force a clean navigation without history pollution
  window.location.replace('/login');
};
