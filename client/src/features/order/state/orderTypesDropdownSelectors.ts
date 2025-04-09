import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store.ts';
import { OrderType } from '@features/order';

const selectOrderTypeState = (state: RootState) => state.orderTypesDropdown;

// Get all order types
export const selectOrderTypesDropdown = createSelector(
  [selectOrderTypeState],
  (orderTypeState) => orderTypeState.orderTypes ?? []
);

// Get all order types grouped by category
export const selectOrderTypesByCategory = createSelector(
  [selectOrderTypesDropdown],
  (orderTypes: OrderType[]) => {
    const groupedByCategory: Record<string, OrderType[]> = {};
    orderTypes.forEach((orderType: OrderType) => {
      if (!groupedByCategory[orderType.category]) {
        groupedByCategory[orderType.category] = [];
      }
      groupedByCategory[orderType.category].push(orderType);
    });
    return groupedByCategory;
  }
);

// Get loading state
export const selectOrderTypesDropdownLoading = createSelector(
  [selectOrderTypeState],
  (orderTypeState) => orderTypeState.loading
);

// Get error state
export const selectOrderTypesDropdownError = createSelector(
  [selectOrderTypeState],
  (orderTypeState) => orderTypeState.error
);
