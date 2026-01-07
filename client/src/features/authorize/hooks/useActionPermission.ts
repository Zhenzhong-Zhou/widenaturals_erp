import useHasPermission from '@features/authorize/hooks/useHasPermission';
import { canPerformAction } from '@features/authorize/utils/permissionUtils';

/**
 * useActionPermission
 *
 * Evaluates whether a specific user action is allowed based on:
 * - Permission requirements
 * - Current entity state (e.g. order status)
 * - Allowed state transitions
 *
 * Responsibilities:
 * - Bridge tri-state permission logic into a strict boolean result
 * - Provide a safe, UI-ready decision for enabling/disabling actions
 *
 * Semantics:
 * - Returns `true` only when permission is explicitly granted
 * - Returns `false` when permission is denied OR still pending
 *
 * Design notes:
 * - This hook intentionally collapses `'pending'` → `false`
 *   to prevent UI flicker or unsafe action exposure
 * - It MUST NOT trigger navigation or side effects
 * - It MUST NOT expose tri-state results to UI components
 *
 * Typical usage:
 * - Button enable/disable logic
 * - Action menu visibility
 * - State transition guards (confirm, cancel, allocate, etc.)
 *
 * @param requiredPermission Permission required to perform the action
 * @param currentState Current entity state (e.g. order status code)
 * @param allowedStates Allowed states for this action
 *
 * @returns Whether the action is currently allowed
 */
const useActionPermission = (
  requiredPermission: string,
  currentState: string,
  allowedStates: readonly string[]
): boolean => {
  const hasPermission = useHasPermission();
  
  return canPerformAction({
    /**
     * Normalize tri-state permission into strict boolean.
     *
     * Pending permissions are treated as denied to ensure
     * actions are never enabled prematurely.
     */
    hasPermission: (perm: string) => hasPermission(perm) === true,
    requiredPermission,
    currentState,
    allowedStates,
  });
};

export default useActionPermission;
