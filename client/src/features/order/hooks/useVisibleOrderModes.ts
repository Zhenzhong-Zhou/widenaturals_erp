import { useMemo } from 'react';
import { ORDER_VIEW_MODES } from '@features/order/constants/orderViewModes';
import { useHasPermission } from '@features/authorize/hooks';
import type { OrderPermissionContext } from '@features/order/state';

/**
 * useVisibleOrderModes
 *
 * Derives the list of order view modes visible to the current user.
 *
 * Responsibilities:
 * - Evaluate order view-mode visibility based on user permissions
 * - Bridge tri-state permission checks into boolean-only business logic
 * - Provide a stable, memoized list for routing and navigation
 *
 * Permission model:
 * - Internally uses `useHasPermission`, which may return:
 *   `true | false | 'pending'`
 * - Tri-state results are normalized to boolean:
 *   `'pending'` is treated as `false`
 * - This ensures deterministic behavior for configs and filters
 *
 * Design notes:
 * - This hook does NOT fetch permissions
 * - This hook does NOT block rendering
 * - This hook does NOT expose tri-state results
 * - Root / superuser behavior is handled by permission hooks
 *
 * Usage:
 * - Orders landing redirects
 * - Orders tab visibility
 * - Mode-based routing decisions
 *
 * @returns A memoized list of order view-mode configs the user can access
 */
const useVisibleOrderModes = () => {
  const hasPermission = useHasPermission();
  
  /**
   * Normalizes tri-state permission results into boolean.
   *
   * Semantics:
   * - `true`     → allowed
   * - `false`    → denied
   * - `'pending'` → treated as denied (non-blocking)
   */
  const normalizePermission = (result: boolean | 'pending'): boolean =>
    result === true;
  
  const ctx = useMemo<OrderPermissionContext>(
    () => ({
      has: (perm) => normalizePermission(hasPermission(perm)),
      hasAny: (perms) => normalizePermission(hasPermission(perms)),
    }),
    [hasPermission]
  );
  
  return useMemo(
    () =>
      Object.values(ORDER_VIEW_MODES).filter((mode) =>
        mode.canSee(ctx)
      ),
    [ctx]
  );
};

export default useVisibleOrderModes;
