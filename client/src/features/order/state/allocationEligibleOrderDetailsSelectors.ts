import { createSelector } from 'reselect';
import type { RootState } from '@store/store';
import type { AllocationEligibleOrderItem } from '@features/order';

// Root slice selector
const selectAllocationEligibleOrderDetailsState = (state: RootState) => state.allocationEligibleOrderDetails;

// Selector: allocation data
export const selectAllocationEligibleOrderDetails = createSelector(
  [selectAllocationEligibleOrderDetailsState],
  (allocationState) => allocationState.data
);

// Selector: loading state
export const selectAllocationEligibleOrderLoading = createSelector(
  [selectAllocationEligibleOrderDetailsState],
  (allocationState) => allocationState.loading
);

// Selector: error state
export const selectAllocationEligibleOrderError = createSelector(
  [selectAllocationEligibleOrderDetailsState],
  (allocationState) => allocationState.error
);

// Selector: all allocation items
export const selectAllocationItems = createSelector(
  [selectAllocationEligibleOrderDetails],
  (details) => details?.items || []
);

// Selector: allocatable items only
export const selectAllocatableItems = createSelector(
  [selectAllocationItems],
  (items: AllocationEligibleOrderItem[]): AllocationEligibleOrderItem[] =>
    items.filter(
      (item) =>
        typeof item.available_quantity === 'number'
    )
);

// Selector: order metadata (e.g., number + status)
export const selectAllocationOrderInfo = createSelector(
  [selectAllocationEligibleOrderDetails],
  (details) => {
    if (!details) return null;
    return {
      orderId: details.order_id,
      orderNumber: details.order_number,
      status: details.order_status_code,
    };
  }
);
