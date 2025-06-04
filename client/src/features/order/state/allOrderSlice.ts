import { createOrderSlice, fetchAllOrdersThunk } from '@features/order';

const allOrdersSlice = createOrderSlice('allOrders', fetchAllOrdersThunk);
export default allOrdersSlice.reducer;
