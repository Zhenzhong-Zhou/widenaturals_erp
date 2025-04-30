import { createOrderSelectors, fetchAllocationEligibleOrdersThunk } from '@features/order';
import { createUseOrders } from '@utils/createUseOrders';

const selectors = createOrderSelectors('allocationEligibleOrders');

const useAllocationEligibleOrders = createUseOrders({
  fetchThunk: fetchAllocationEligibleOrdersThunk,
  selectors,
});

export default useAllocationEligibleOrders;
