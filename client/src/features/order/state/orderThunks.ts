import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateSalesOrderInput,
  CreateSalesOrderResponse,
  GetOrderDetailsResponse,
  OrderListResponse,
  OrderQueryParams,
  OrderRouteParams,
  UpdateOrderStatusResponse,
} from '@features/order/state/orderTypes';
import { orderService } from '@services/orderService';

/**
 * Thunk to create a new sales order under a given category.
 *
 * Sends a POST request to the appropriate category route (e.g., `/orders/create/sales`)
 * with full order metadata and item details. Commonly used in checkout flows,
 * admin order creation, or internal sales modules.
 *
 * Dispatch lifecycle:
 * - `orders/createSalesOrder/pending`: dispatched when the request starts
 * - `orders/createSalesOrder/fulfilled`: dispatched on successful response
 * - `orders/createSalesOrder/rejected`: dispatched if the request fails
 *
 * @param args - Includes the order `category` (e.g., 'sales', 'purchase') and the `data` payload.
 * @returns A {@link CreateSalesOrderResponse} containing the newly created order ID.
 */
export const createSalesOrderThunk = createAsyncThunk<
  CreateSalesOrderResponse,
  { category: string; data: CreateSalesOrderInput }
>('orders/createSalesOrder', async ({ category, data }, thunkAPI) => {
  try {
    return await orderService.createSalesOrder(category, data);
  } catch (error: any) {
    console.error('createSalesOrderThunk failed:', error);
    return thunkAPI.rejectWithValue(error?.response?.data || error.message);
  }
});

/**
 * Thunk to fetch a paginated list of orders for a specific category.
 *
 * This thunk:
 * - Accepts a category (e.g., 'sales', 'purchase') and optional filter/sort query parameters
 * - Dispatches Redux actions to update loading, data, and error states automatically
 * - Calls the underlying `orderService.fetchOrdersByCategory` API method
 * - Returns the API response payload on success (`OrderListResponse`)
 * - Returns a rejected value on failure for error handling in reducers
 *
 * Useful for listing orders in paginated tables, filtered dashboards, or category-based views.
 *
 * Usage example:
 * ```ts
 * dispatch(fetchOrdersByCategoryThunk({ category: 'sales', params: { keyword: 'NMN' } }));
 * ```
 *
 * @param args - Object containing:
 *   - `category`: Order category (e.g., 'sales', 'purchase')
 *   - `params`: Optional query parameters such as keyword, page, sort, filters
 *
 * @returns A Promise resolving to the fetched order list or a rejected value containing an error message
 */
export const fetchOrdersByCategoryThunk = createAsyncThunk<
  OrderListResponse, // Return type
  { category: string; params?: OrderQueryParams }, // Argument type
  { rejectValue: string } // Optional reject payload
>(
  'orders/fetchByCategory',
  async ({ category, params }, { rejectWithValue }) => {
    try {
      return await orderService.fetchOrdersByCategory(category, params);
    } catch (error: any) {
      console.error('fetchOrdersByCategoryThunk error:', error);
      return rejectWithValue(error?.message ?? 'Failed to fetch orders');
    }
  }
);

/**
 * Redux thunk to fetch detailed information for a single order by ID.
 *
 * This thunk:
 * - Sends a GET request to the backend using the given `orderId` and category.
 * - Dispatches `pending`, `fulfilled`, and `rejected` actions automatically.
 * - Handles both order header and associated order items in the response.
 *
 * Expected Behavior:
 * - Trims and sanitizes the `orderId` and `category` internally before calling the API.
 * - Returns a structured payload on success, matching `GetOrderDetailsResponse`.
 * - Throws and logs errors to the console on failure.
 *
 * @param {Object} params - The route parameters.
 * @param {string} params.category - Order category (e.g., 'sales', 'transfer').
 * @param {string} params.orderId - Order UUID string.
 * @returns {Promise<GetOrderDetailsResponse>} - The fetched order details payload.
 *
 * Example usage:
 *   dispatch(getOrderDetailsByIdThunk({ category: 'sales', orderId: '550e8400-e29b-41d4-a716-446655440000' }));
 */
export const getOrderDetailsByIdThunk = createAsyncThunk<
  GetOrderDetailsResponse, // Return type
  OrderRouteParams, // Argument type
  { rejectValue: string } // Optional reject payload type
>(
  'orders/getOrderDetailsById',
  async ({ category, orderId }, { rejectWithValue }) => {
    try {
      return await orderService.fetchOrderDetailsById({ category, orderId });
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      return rejectWithValue(err?.message || 'Failed to fetch order details');
    }
  }
);

/**
 * Thunk to update the status of a specific order via API.
 *
 * This thunk handles the full request lifecycle (pending, fulfilled, rejected)
 * using Redux Toolkit's `createAsyncThunk`. It sends a PATCH request to the
 * appropriate order status update endpoint and returns the updated status
 * for both the order and its items.
 *
 * Typical use case: triggered when a user manually updates an order status
 * (e.g., from "pending" to "allocated" or "shipped").
 *
 * @param payload - Object containing:
 *   - `params`: Route parameters including `category` and `orderId`.
 *   - `data`: Payload with the new status code (e.g., `{ statusCode: 'ORDER_SHIPPED' }`)
 *
 * @example
 * dispatch(updateOrderStatusThunk({
 *   params: { category: 'sales', orderId: 'abc123' },
 *   data: { statusCode: 'ORDER_ALLOCATED' }
 * }));
 *
 * @returns A promise that resolves to the updated order and item statuses.
 * @throws Will dispatch `rejected` action if the request fails.
 */
export const updateOrderStatusThunk = createAsyncThunk<
  UpdateOrderStatusResponse, // Return type
  { params: OrderRouteParams; data: { statusCode: string } }, // Argument type
  { rejectValue: string } // Optional extra options
>('orders/updateOrderStatus', async ({ params, data }, { rejectWithValue }) => {
  try {
    return await orderService.updateOrderStatus(params, data);
  } catch (err: any) {
    console.error('Error in updateOrderStatusThunk:', err);
    return rejectWithValue(err?.message ?? 'Failed to update order status');
  }
});
