import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateSalesOrderInput,
  CreateSalesOrderResponse,
  GetOrderDetailsResponse,
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
>(
  'orders/createSalesOrder',
  async ({ category, data }, thunkAPI) => {
    try {
      return await orderService.createSalesOrder(category, data);
    } catch (error: any) {
      console.error('createSalesOrderThunk failed:', error);
      return thunkAPI.rejectWithValue(error?.response?.data || error.message);
    }
  }
);

/**
 * Thunk to fetch a single order's details (header + items) by ID.
 *
 * Dispatches pending/fulfilled/rejected actions automatically.
 *
 * @param orderId - Order UUID string.
 * @returns Fulfilled with the API response payload.
 */
export const getOrderDetailsByIdThunk = createAsyncThunk<
  GetOrderDetailsResponse, // Return type
  string,                  // Argument type
  { rejectValue: string }  // Optional reject payload type
>(
  'orders/getOrderDetailsById',
  async (orderId, { rejectWithValue }) => {
    try {
      return await orderService.fetchOrderDetailsById(orderId);
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      return rejectWithValue(err?.message || 'Failed to fetch order details');
    }
  }
);
