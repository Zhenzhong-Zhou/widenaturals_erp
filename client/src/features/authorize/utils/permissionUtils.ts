/**
 * Evaluates whether an action is permitted based on
 * user permissions and a contextual state value.
 *
 * Characteristics:
 * - Pure and synchronous
 * - Framework-agnostic (no React dependencies)
 * - Domain-agnostic (usable beyond orders)
 *
 * Semantics:
 * - Permission check is evaluated first
 * - State constraint is evaluated second
 * - Both conditions MUST be satisfied
 *
 * Design notes:
 * - This utility assumes permission resolution has already completed
 * - It does NOT handle loading or "pending" states
 * - Callers must normalize permission results before invoking
 *
 * Typical use cases:
 * - Button enable/disable logic
 * - Conditional action visibility
 * - Contextual UI behavior (status-based actions)
 *
 * @param params.hasPermission Predicate that returns `true` if permission is granted
 * @param params.requiredPermission Permission identifier required for the action
 * @param params.currentState Current contextual state (e.g. status code)
 * @param params.allowedStates Allowed states in which the action is valid
 *
 * @returns `true` if the action is permitted, otherwise `false`
 */
export const canPerformAction = (params: {
  hasPermission: (permission: string) => boolean;
  requiredPermission: string;
  currentState: string;
  allowedStates: readonly string[];
}): boolean => {
  const {
    hasPermission,
    requiredPermission,
    currentState,
    allowedStates,
  } = params;
  
  return (
    hasPermission(requiredPermission) &&
    allowedStates.includes(currentState)
  );
};
