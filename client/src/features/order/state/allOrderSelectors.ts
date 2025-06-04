import { createOrderSelectors } from '@features/order';

export const {
  selectOrders: selectAllOrders,
  selectLoading: selectOrdersLoading,
  selectError: selectOrdersError,
  selectPagination: selectOrdersPagination,
  selectOrdersByStatus: selectOrdersByStatus,
  selectOrderById: selectOrderById,
} = createOrderSelectors('allOrders');
