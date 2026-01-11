import { type ReactNode, useEffect, useRef } from 'react';
import { useAppDispatch } from '@store/storeHooks';
import { bootstrapSessionThunk } from '@features/session/state/sessionThunks';

/**
 * AppBootstrapGate
 *
 * One-time application bootstrap orchestrator.
 *
 * Responsibilities:
 * - Trigger session bootstrap exactly once on initial app mount
 * - Delegate all bootstrap logic to Redux thunks
 *
 * Explicitly out of scope:
 * - Rendering loading states or fallback UI
 * - Blocking child rendering
 * - Authentication, authorization, or routing decisions
 *
 * Notes:
 * - A ref is used to guarantee idempotent execution, including
 *   under React 18 Strict Mode double-invocation of effects
 * - This component must be mounted at the root of the app
 */
const AppBootstrapGate = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  // Guard against double execution in React 18 Strict Mode
  const bootstrapped = useRef(false);
  
  useEffect(() => {
    // Ensure bootstrap runs only once, even under Strict Mode
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    
    dispatch(bootstrapSessionThunk());
  }, [dispatch]);
  
  return <>{children}</>;
};

export default AppBootstrapGate;
