import {
  createOrderSlice,
  fetchAllocationEligibleOrdersThunk,
} from '@features/order';

const allocationEligibleOrdersSlice = createOrderSlice(
  'allocationEligibleOrders',
  fetchAllocationEligibleOrdersThunk
);
export default allocationEligibleOrdersSlice.reducer;
