import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService } from '@services/dropdownService';
import type {
  CreateSalesOrderResponse,
  FetchOrdersParams,
  OrderDetailsResponse,
  OrderStatusUpdateResponse,
  OrderType,
  SalesOrder,
} from '@features/order';
import { orderService } from '@services/orderService';

export const fetchOrderTypesDropDownThunk = createAsyncThunk<
  OrderType[], // Expected return type
  void, // No arguments needed
  { rejectValue: string } // Error type
>('orderTypes/fetchDropdown', async (_, { rejectWithValue }) => {
  try {
    return await dropdownService.fetchOrderTypesForDropdown(); // Must return OrderType[]
  } catch (error) {
    console.error('Error fetching order types:', error);
    return rejectWithValue('Failed to fetch order types.');
  }
});

// Define Thunk for creating a sales order
export const createSalesOrderThunk = createAsyncThunk<
  CreateSalesOrderResponse, // Return type
  { orderTypeId: string; orderData: SalesOrder }, // Payload type
  { rejectValue: string } // Error type
>(
  'salesOrder/create',
  async ({ orderTypeId, orderData }, { rejectWithValue }) => {
    try {
      return await orderService.createSalesOrder(orderTypeId, orderData);
    } catch (error) {
      return rejectWithValue('Failed to create sales order');
    }
  }
);

// Thunk for fetching all orders
export const fetchAllOrdersThunk = createAsyncThunk(
  'orders/fetchAllOrders',
  async (params: FetchOrdersParams, { rejectWithValue }) => {
    try {
      return await orderService.fetchAllOrders(params);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Thunk to fetch sales order details by order ID
 */
export const fetchSalesOrderDetailsThunk = createAsyncThunk<
  OrderDetailsResponse,
  string,
  { rejectValue: string }
>('salesOrderDetails/fetch', async (orderId, { rejectWithValue }) => {
  try {
    return await orderService.fetchSalesOrderDetails(orderId);
  } catch (error: any) {
    console.error('Error in fetchSalesOrderDetailsThunk:', error.message);
    return rejectWithValue(
      'Failed to fetch sales order details. Please try again.'
    );
  }
});

/**
 * Thunk to confirm a sales order.
 *
 * Dispatches API request to confirm a sales order and handles response or error.
 *
 * @param {string} orderId - UUID of the sales order.
 * @returns {Promise<OrderStatusUpdateResponse>} - Confirmed order response data.
 */
export const confirmSalesOrderThunk = createAsyncThunk<
  OrderStatusUpdateResponse, // Return type
  string, // Payload type (orderId)
  { rejectValue: string } // Error type for rejected action
>('salesOrder/confirm', async (orderId, { rejectWithValue }) => {
  try {
    return await orderService.confirmSalesOrder(orderId);
  } catch (error: any) {
    console.error('Error confirming sales order:', error);
    return rejectWithValue(
      'Failed to confirm sales order. Please try again later.'
    );
  }
});
