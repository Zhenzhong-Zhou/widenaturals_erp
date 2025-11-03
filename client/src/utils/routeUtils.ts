import type { OrderRouteParams } from '@features/order/state';
import { isValidOrderCategory } from '@features/order/utils/orderCategoryUtils';

/**
 * Resolves the actual permission string based on a `requiredPermission` input,
 * which can either be a static string or a dynamic function depending on route parameters.
 *
 * This is typically used in protected routes or permission checks where the permission
 * may depend on the current `category` (e.g., `sales`, `purchase`, etc.).
 *
 * Behavior:
 * - If `requiredPermission` is a static string → returns it directly.
 * - If `requiredPermission` is a function → invokes it with the route params if `category` is valid.
 *   - Ensures `category` is a valid order category before calling the function.
 * - If `requiredPermission` is `undefined` or the category is invalid → returns `undefined`.
 *
 * @param {string | function} requiredPermission - A static permission string (e.g. `'view_orders'`) or
 *   a function that generates one dynamically from route params (e.g. `(params) => 'view_' + params.category + '_order'`).
 * @param {Object} routeParams - The current route parameters (must include `category` for dynamic functions).
 * @returns {string | undefined} - The resolved permission string or `undefined` if not resolvable.
 *
 * @example
 * resolvePermission('view_orders', { category: 'sales' });
 * // → 'view_orders'
 *
 * resolvePermission((params) => `view_${params.category}_order`, { category: 'sales' });
 * // → 'view_sales_order'
 *
 * resolvePermission((params) => `view_${params.category}_order`, { category: 'unknown' });
 * // → undefined (invalid category)
 */
export const resolvePermission = (
  requiredPermission:
    | string
    | ((params: { mode?: string }) => string)
    | ((params: OrderRouteParams) => string)
    | undefined,
  routeParams: Record<string, string | undefined>
): string | undefined => {
  if (typeof requiredPermission === 'function') {
    const category = routeParams?.category;
    if (typeof category === 'string' && isValidOrderCategory(category)) {
      return requiredPermission(routeParams as OrderRouteParams);
    }
  }

  return typeof requiredPermission === 'string'
    ? requiredPermission
    : undefined;
};
