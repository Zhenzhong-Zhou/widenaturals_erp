/**
 * @file Order permission utilities.
 *
 * Provides the canonical formula for order permission strings and a factory
 * for route-level dynamic permission resolvers parameterized by `:category`.
 *
 * Composite categories ('all', 'allocatable') are read-only aggregate views.
 * They resolve VIEW access to the union of VIEW permissions across all real
 * categories, so any user who can view any single real category can see the
 * aggregate. Non-VIEW actions on composite categories are unsupported and
 * resolve to null (route → /not-found).
 *
 * Exports:
 *   - toPermissionValue
 *   - buildOrderPermissionResolver
 */

import type { DynamicPermissionResolver } from '@routes/routeTypes';
import {
  ORDER_CATEGORIES,
  type OrderAction,
  type OrderCategory,
} from '@utils/constants/orderPermissions';
import { isValidOrderCategory } from './orderCategoryUtils';

/** Aggregate views — not real order types, read-only. */
const COMPOSITE_CATEGORIES = ['all', 'allocatable'] as const;
type CompositeCategory = (typeof COMPOSITE_CATEGORIES)[number];

const COMPOSITE_CATEGORY_SET: ReadonlySet<OrderCategory> = new Set(
  COMPOSITE_CATEGORIES
);

export const isCompositeCategory = (c: OrderCategory): c is CompositeCategory =>
  COMPOSITE_CATEGORY_SET.has(c);

/** Real categories — everything except aggregate views. */
const REAL_CATEGORIES = ORDER_CATEGORIES.filter(
  (c): c is Exclude<OrderCategory, CompositeCategory> => !isCompositeCategory(c)
);

/**
 * Builds the canonical permission string for an (action, category) pair.
 *
 * Format: `<action_lower>_<category>_order`
 * Example: toPermissionValue('VIEW', 'sales') → 'view_sales_order'
 */
export const toPermissionValue = (
  action: OrderAction,
  category: OrderCategory
) => `${action.toLowerCase()}_${category}_order`;

/**
 * Precomputed union of VIEW permissions across real categories. Used by
 * composite-category VIEW resolutions so the array is built once per
 * module load rather than on every resolver call.
 */
export const COMPOSITE_VIEW_PERMISSIONS: readonly string[] = REAL_CATEGORIES.map(
  (c) => toPermissionValue('VIEW', c)
);

/**
 * Creates a route-level dynamic permission resolver scoped to a single
 * order action. The returned resolver reads `params.category` from the
 * URL and produces an "any-of" permission rule.
 *
 * Resolution:
 *   - Missing/invalid category       → null (PermissionGuard → /not-found)
 *   - Composite category, non-VIEW   → null (no create/update/delete on aggregates)
 *   - Composite category, VIEW       → union of VIEW perms across real categories
 *   - Real category, any action      → single (action, category) permission
 *
 * Use one resolver per route, parameterized by the action the route performs.
 *
 * @example
 * defineRoute({
 *   path: '/orders/:category',
 *   meta: { requiredPermission: buildOrderPermissionResolver('VIEW') },
 * });
 */
export const buildOrderPermissionResolver =
  (action: OrderAction): DynamicPermissionResolver =>
    (params) => {
      const category = params.category;
      if (!category || !isValidOrderCategory(category)) return null;
      
      if (isCompositeCategory(category)) {
        if (action !== 'VIEW') return null;
        // Spread to hand callers a fresh, mutable array; the source is shared.
        return { any: [...COMPOSITE_VIEW_PERMISSIONS] };
      }
      
      return { any: [toPermissionValue(action, category)] };
    };
