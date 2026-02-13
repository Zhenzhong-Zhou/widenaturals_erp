import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type {
  OrderDetailsUiData,
  FlattenedOrderHeader,
  FlattenedOrderItemRow,
} from '@features/order/state';

// ---------------------------
// Base selector (MUST be plain function)
// ---------------------------
const selectOrderDetailsState = (state: RootState) =>
  selectRuntime(state).orderDetails;

// ---------------------------
// Primitive selectors
// ---------------------------
export const selectOrderDetailsLoading = createSelector(
  [selectOrderDetailsState],
  (s) => s.loading
);

export const selectOrderDetailsError = createSelector(
  [selectOrderDetailsState],
  (s) => s.error
);

export const selectOrderDetailsData = createSelector(
  [selectOrderDetailsState],
  (s): OrderDetailsUiData | null => s.data
);

// ---------------------------
// Header + items
// ---------------------------
export const selectOrderHeader = createSelector(
  [selectOrderDetailsData],
  (data): FlattenedOrderHeader | null => data?.header ?? null
);

export const selectOrderItems = createSelector(
  [selectOrderDetailsData],
  (data): FlattenedOrderItemRow[] => data?.items ?? []
);

export const selectOrderItemCount = createSelector(
  [selectOrderItems],
  (items) => items.length
);

// ---------------------------
// Factories
// ---------------------------
export const makeSelectOrderItemById = (orderItemId: string) =>
  createSelector([selectOrderItems], (items) => {
    return items.find((it) => it.orderItemId === orderItemId) ?? null;
  });

// ---------------------------
// Convenience booleans / derived values
// ---------------------------
export const selectHasOrder = createSelector(
  [selectOrderDetailsData],
  (data) => Boolean(data)
);

/**
 * (Optional) Numeric totals derived from header fields.
 * Keeps parsing out of components and memoizes the result.
 *
 * Assumes FlattenedOrderHeader contains `shippingFee` and `totalAmount`
 * as strings or nullable strings.
 */
export const selectOrderTotals = createSelector([selectOrderHeader], (header) => {
  if (!header) return { shippingFee: 0, totalAmount: 0 };
  
  const shippingFee = Number(header.shippingFee ?? 0) || 0;
  const totalAmount = Number(header.totalAmount ?? 0) || 0;
  
  return { shippingFee, totalAmount };
});
