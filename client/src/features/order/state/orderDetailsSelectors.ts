import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import type {
  OrderItem,
  TransformedOrder,
} from '@features/order/state/orderTypes';

/** Base selector: the whole orderDetails slice */
export const selectOrderDetailsState= createSelector(
  [selectRuntime],
  (runtime) => runtime.orderDetails
);

/** Is the details request in-flight? */
export const selectOrderDetailsLoading = createSelector(
  [selectOrderDetailsState],
  (s) => s.loading
);

/** Last error message (if any) */
export const selectOrderDetailsError = createSelector(
  [selectOrderDetailsState],
  (s) => s.error
);

/** Full `TransformedOrder` payload (or null) */
export const selectOrderDetailsData = createSelector(
  [selectOrderDetailsState],
  (s) => s.data
);

/**
 * Header-only view of the order (everything except `items`).
 * Useful for pages that render meta without subscribing to the items array.
 */
export const selectOrderHeader = createSelector(
  [selectOrderDetailsData],
  (data): Omit<TransformedOrder, 'items'> | null => {
    if (!data) return null;
    // Return a new object only when `data` reference changes (memoized by createSelector)
    // so consumers won’t re-render unless the order payload updates.
    const { items, ...header } = data;
    return header;
  }
);

/** Order items array (defaults to empty array for convenient mapping) */
export const selectOrderItems = createSelector(
  [selectOrderDetailsData],
  (data) => data?.items ?? []
);

/** Item count (stable number for badges, etc.) */
export const selectOrderItemCount = createSelector(
  [selectOrderItems],
  (items) => items.length
);

/**
 * Factory selector: get a single item by ID.
 * Use inside components to subscribe to just one item.
 *
 * @example
 * const selectItem = makeSelectOrderItemById(itemId);
 * const item = useAppSelector(selectItem);
 */
export const makeSelectOrderItemById = (itemId: string) =>
  createSelector(
    [selectOrderItems],
    (items) => items.find((it: OrderItem) => it.id === itemId) ?? null
  );

/** Quick boolean for route guards / skeletons */
export const selectHasOrder = createSelector([selectOrderDetailsData], (data) =>
  Boolean(data)
);

/**
 * (Optional) Numeric totals derived from string fields.
 * Keeps parsing out of components and memoizes the result.
 */
export const selectOrderTotals = createSelector(
  [selectOrderDetailsData],
  (data) => {
    if (!data) return { shippingFee: 0, totalAmount: 0 };
    const shippingFee = parseFloat(data.shippingFee ?? '0') || 0;
    const totalAmount = parseFloat(data.totalAmount ?? '0') || 0;
    return { shippingFee, totalAmount };
  }
);
