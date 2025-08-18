import type { OrderRouteParams } from '@features/order/state';
import { isValidOrderCategory } from '@features/order/utils/orderCategoryUtils';

/**
 * Resolves a permission value from either a static string or a dynamic function
 * based on route parameters.
 *
 * This is useful for routes that define `requiredPermission` as either:
 * - A static permission string (e.g., 'view_sales_order')
 * - A function that returns the permission dynamically (e.g., based on `category`)
 *
 * @param requiredPermission - A static permission string or a function that returns one based on route params
 * @param routeParams - The route parameters extracted from the current URL (e.g., { category: 'sales', orderId: '123' })
 * @returns A resolved permission string or undefined if not resolvable
 *
 * @example
 * resolvePermission('view_orders', {}) // 'view_orders'
 * resolvePermission((params) => `view_${params.category}_order`, { category: 'sales' }) // 'view_sales_order'
 */
export const resolvePermission = (
  requiredPermission: string | ((params: OrderRouteParams) => string) | undefined,
  routeParams: Record<string, string | undefined>
): string | undefined => {
  if (typeof requiredPermission === 'function') {
    const category = routeParams?.category;
    if (typeof category === 'string' && isValidOrderCategory(category)) {
      return requiredPermission(routeParams as OrderRouteParams);
    }
  }
  
  return typeof requiredPermission === 'string' ? requiredPermission : undefined;
};
