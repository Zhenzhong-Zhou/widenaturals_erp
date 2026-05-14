/**
 * @file useOrderActionPermissions — per-action permission flags for the
 * current order category, used by pages and components to gate UI controls
 * (Create / Edit / Delete buttons, action menus) without inlining
 * permission-string lookups at every call site.
 *
 * Pairs with buildOrderPermissionResolver: both apply the same
 * (action, category) → permission formula via toPermissionValue and share
 * the same composite-category rules from orderPermissionUtils, so route
 * guards and UI gating stay in lockstep.
 *
 * Exports:
 *   - useOrderActionPermissions (default)
 */

import { useMemo } from 'react';
import { useHasPermission } from '@features/authorize/hooks';
import {
  ORDER_ACTIONS,
  type OrderAction,
} from '@utils/constants/orderPermissions';
import { isValidOrderCategory } from '@features/order/utils/orderCategoryUtils';
import {
  COMPOSITE_VIEW_PERMISSIONS,
  isCompositeCategory,
  toPermissionValue,
} from '@features/order/utils/orderPermissionUtils';

type ActionFlags = Record<Lowercase<OrderAction>, boolean>;

const EMPTY_FLAGS: ActionFlags = {
  view: false,
  create: false,
  update: false,
  delete: false,
};

/**
 * Returns per-action permission flags for the given order category.
 *
 * Resolution mirrors buildOrderPermissionResolver:
 *   - Missing/invalid category → all flags false
 *   - Composite category       → view = user has any real-category VIEW; rest false
 *   - Real category            → one flag per action via toPermissionValue
 *
 * Result is memoized on `category` and the permission-checker reference,
 * so flags only recompute when the route's category changes or auth state
 * updates.
 *
 * @param category - Current order category, typically from useParams.
 *                   Accepts unknown strings; invalid values yield all-false.
 * @returns ActionFlags record keyed by lowercase action name.
 *
 * @example
 * const { create: canCreate } = useOrderActionPermissions(category);
 * {canCreate && <CustomButton onClick={...}>Create</CustomButton>}
 */
const useOrderActionPermissions = (category?: string): ActionFlags => {
  const checkPermission = useHasPermission();

  return useMemo(() => {
    if (!category || !isValidOrderCategory(category)) return EMPTY_FLAGS;

    if (isCompositeCategory(category)) {
      return {
        ...EMPTY_FLAGS,
        // Spread to a mutable copy — checkPermission's signature expects string[].
        view: checkPermission([...COMPOSITE_VIEW_PERMISSIONS]) === true,
      };
    }

    return ORDER_ACTIONS.reduce<ActionFlags>(
      (acc, action) => {
        acc[action.toLowerCase() as Lowercase<OrderAction>] =
          checkPermission(toPermissionValue(action, category)) === true;
        return acc;
      },
      { ...EMPTY_FLAGS }
    );
  }, [category, checkPermission]);
};

export default useOrderActionPermissions;
