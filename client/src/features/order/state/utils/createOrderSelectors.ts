import { createSelector } from 'reselect';
import type { RootState } from '@store/store';
import type { Order, OrdersResponse } from '@features/order';

export const createOrderSelectors = (sliceKey: keyof RootState) => {
  const selectSlice = (state: RootState) =>
    state[sliceKey] as {
      orders: Order[];
      loading: boolean;
      error: string | null;
      pagination: OrdersResponse['pagination'];
    };

  const selectOrders = createSelector([selectSlice], (s) => s.orders);
  const selectLoading = createSelector([selectSlice], (s) => s.loading);
  const selectError = createSelector([selectSlice], (s) => s.error);
  const selectPagination = createSelector([selectSlice], (s) => s.pagination);

  const selectOrdersByStatus = (status: string) =>
    createSelector([selectOrders], (orders) =>
      orders.filter((order) => order.status === status)
    );

  const selectOrderById = (id: string) =>
    createSelector([selectOrders], (orders) =>
      orders.find((order) => order.id === id)
    );

  return {
    selectOrders,
    selectLoading,
    selectError,
    selectPagination,
    selectOrdersByStatus,
    selectOrderById,
  };
};
