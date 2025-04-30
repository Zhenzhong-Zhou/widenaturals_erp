import { createOrderSelectors, fetchAllOrdersThunk } from '@features/order';
import { createUseOrders } from '@utils/createUseOrders';

const selectors = createOrderSelectors('allOrders');

const useAllOrders = createUseOrders({
  fetchThunk: fetchAllOrdersThunk,
  selectors,
});

export default useAllOrders;
