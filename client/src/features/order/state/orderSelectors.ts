import { createSelector } from 'reselect';
import { RootState } from '@store/store';
import { Order } from '@features/order';

// Root selector for the orders slice
const selectOrdersState = (state: RootState) => state.orders;

// Selector to get all orders
export const selectAllOrders = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState.orders
);

// Selector to get loading state
export const selectOrdersLoading = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState.loading
);

// Selector to get error state
export const selectOrdersError = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState.error
);

// Selector to get pagination data
export const selectOrdersPagination = createSelector(
  [selectOrdersState],
  (ordersState) => ordersState.pagination
);

// Selector to get orders by status (Memoized)
export const selectOrdersByStatus = (status: string) =>
  createSelector([selectAllOrders], (orders: Order[]) =>
    orders.filter(order => order.status === status)
  );

// Selector to get order by ID (Memoized)
export const selectOrderById = (orderId: string) =>
  createSelector([selectAllOrders], (orders: Order[]) =>
    orders.find(order => order.id === orderId)
  );
