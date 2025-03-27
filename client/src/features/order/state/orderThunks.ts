import { createAsyncThunk } from '@reduxjs/toolkit';
import { CreateSalesOrderResponse, FetchOrdersParams, OrderType, SalesOrder } from './orderTypes.ts';
import { dropdownService, orderService } from '../../../services';

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
