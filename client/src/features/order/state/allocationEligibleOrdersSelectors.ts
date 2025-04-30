import { createOrderSelectors } from '@features/order';

export const {
  selectOrders: selectAllocationEligibleOrders,
  selectLoading: selectAllocationEligibleOrdersLoading,
  selectError: selectAllocationEligibleOrdersError,
  selectPagination: selectAllocationEligibleOrdersPagination,
  selectOrdersByStatus: selectAllocationEligibleOrdersByStatus,
  selectOrderById: selectAllocationEligibleOrderById,
} = createOrderSelectors('allocationEligibleOrders');
