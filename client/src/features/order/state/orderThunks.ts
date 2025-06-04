import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService } from '@services/dropdownService';
import {
  type AllocationEligibleOrderDetailsResponse,
  createOrderThunk,
  type CreateSalesOrderResponse,
  type OrderDetailsResponse,
  type OrderStatusUpdateResponse,
  type OrderType,
  type SalesOrder,
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

export const fetchAllOrdersThunk = createOrderThunk(
  'orders/fetchAllOrders',
  orderService.fetchAllOrders
);

export const fetchAllocationEligibleOrdersThunk = createOrderThunk(
  'orders/fetchAllocationEligibleOrders',
  orderService.fetchAllocationEligibleOrders
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

/**
 * Thunk to fetch allocation-eligible order details for inventory allocation.
 *
 * This async thunk calls the `fetchAllocationEligibleOrderDetails` service,
 * which retrieves allocation-relevant order data (e.g., product, inventory info)
 * for a given order ID, provided it is in an allocation-eligible status.
 *
 * The result is expected to be used in inventory reservation or fulfillment flows.
 *
 * @param orderId - The ID of the order to fetch
 * @returns An `AllocationEligibleOrderDetailsResponse` if successful
 * @throws A rejected action with the error message if the fetch fails
 *
 * @example
 * dispatch(fetchAllocationEligibleOrderDetailsThunk('order-id-123'));
 */
export const fetchAllocationEligibleOrderDetailsThunk = createAsyncThunk<
  AllocationEligibleOrderDetailsResponse,
  string,
  { rejectValue: string }
>(
  'orders/fetchAllocationEligibleOrderDetails',
  async (orderId, { rejectWithValue }) => {
    try {
      return await orderService.fetchAllocationEligibleOrderDetails(orderId);
    } catch (error: any) {
      console.error('Thunk error:', error);
      return rejectWithValue(
        error.message ?? 'Failed to load order allocation data.'
      );
    }
  }
);
