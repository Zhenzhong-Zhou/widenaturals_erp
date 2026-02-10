import { type ReactNode, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { bootstrapSessionThunk } from '@features/session/state/sessionThunks';
import { selectSessionBootstrapped } from '@features/session/state/sessionSelectors';

/**
 * AppBootstrapGate
 *
 * Root-level application bootstrap coordinator.
 *
 * Responsibilities:
 * - Triggers the session bootstrap flow exactly once on initial app mount
 * - Ensures the client resolves authentication state before rendering routes
 * - Delegates all bootstrap logic to Redux (no side effects here)
 *
 * Explicitly out of scope:
 * - Rendering authentication UI or loading indicators
 * - Making routing or authorization decisions
 * - Handling login, logout, or token refresh logic
 *
 * Behavioral guarantees:
 * - Children are rendered only after session bootstrap completes
 * - Prevents premature route guards from redirecting during reload
 *
 * Implementation notes:
 * - Uses a ref to guarantee idempotent execution, including under
 *   React 18 Strict Mode double-invocation of effects
 * - Must be mounted ABOVE the router and all route guards
 */
const AppBootstrapGate = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const bootstrapped = useAppSelector(selectSessionBootstrapped);
  
  // Guards against duplicate bootstrap in React 18 Strict Mode
  const started = useRef(false);
  
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    
    // Bootstrap resolves auth state via refresh-token flow
    dispatch(bootstrapSessionThunk());
  }, [dispatch]);
  
  // Block rendering until session state is fully resolved
  if (!bootstrapped) {
    return null; // Optionally replace with splash / skeleton
  }
  
  return <>{children}</>;
};

export default AppBootstrapGate;
