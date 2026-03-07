/**
 * ================================================================
 * Order Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates asynchronous order workflows.
 * - Serves as the business boundary between UI and orderService.
 *
 * Scope:
 * - Order creation
 * - Category-based order listing
 * - Order aggregate retrieval
 * - Order status transitions
 *
 * Architecture:
 * - Thunks coordinate API calls via `orderService`.
 * - UI normalization occurs at the thunk boundary (not in reducers).
 * - Reducers remain pure and state-focused.
 *
 * Error Model:
 * - All failures return `UiErrorPayload`.
 * - Errors are normalized via `extractUiErrorPayload`.
 *
 * Design Rules:
 * - No direct component logic.
 * - No persistence logic.
 * - Transformations happen here when needed for UI consumption.
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateSalesOrderInput,
  CreateSalesOrderResponse,
  GetOrderDetailsUiResponse,
  OrderListResponse,
  OrderQueryParams,
  OrderRouteParams,
  UpdateOrderStatusResponse,
} from '@features/order/state/orderTypes';
import { orderService } from '@services/orderService';
import {
  flattenOrderItems,
  normalizeSalesOrderHeader,
} from '@features/order/utils';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { ErrorType, extractUiErrorPayload } from '@utils/error';

/* ------------------------------------------------------------------ */
/* Create Sales Order */
/* ------------------------------------------------------------------ */

/**
 * Creates a new order under a given category.
 *
 * Responsibilities:
 * - Calls orderService.createSalesOrder
 * - Returns API response directly
 * - Standardizes errors via `rejectWithValue`
 *
 * @param category - Order category (e.g., 'sales', 'purchase')
 * @param data     - Sales order payload
 */
export const createSalesOrderThunk = createAsyncThunk<
  CreateSalesOrderResponse,
  { category: string; data: CreateSalesOrderInput },
  { rejectValue: UiErrorPayload }
>(
  'orders/createSalesOrder',
  async ({ category, data }, { rejectWithValue }) => {
    try {
      return await orderService.createSalesOrder(category, data);
    } catch (error: unknown) {
      console.error('createSalesOrderThunk failed:', {
        category,
        error,
      });

      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/* ------------------------------------------------------------------ */
/* Fetch Orders By Category */
/* ------------------------------------------------------------------ */

/**
 * Fetches a paginated list of orders for a specific category.
 *
 * Responsibilities:
 * - Calls orderService.fetchOrdersByCategory
 * - Passes through pagination and filter params
 * - Standardizes error handling
 *
 * @param category - Order category
 * @param params   - Optional pagination and filter parameters
 */
export const fetchOrdersByCategoryThunk = createAsyncThunk<
  OrderListResponse,
  { category: string; params?: OrderQueryParams },
  { rejectValue: UiErrorPayload }
>(
  'orders/fetchByCategory',
  async ({ category, params }, { rejectWithValue }) => {
    try {
      return await orderService.fetchOrdersByCategory(category, params);
    } catch (error: unknown) {
      console.error('fetchOrdersByCategoryThunk error:', {
        category,
        params,
        error,
      });

      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/* ------------------------------------------------------------------ */
/* Fetch Order Details */
/* ------------------------------------------------------------------ */

/**
 * Fetches a single order aggregate and transforms it into
 * UI-ready structure.
 *
 * Responsibilities:
 * - Validates route parameters
 * - Calls orderService.fetchOrderDetailsById
 * - Normalizes header and items
 * - Returns flattened UI payload
 *
 * Transformation Boundary:
 * - Header → normalizeSalesOrderHeader
 * - Items  → flattenOrderItems
 *
 * @param category - Order category
 * @param orderId  - Order UUID
 */
export const fetchOrderDetailsByIdThunk = createAsyncThunk<
  GetOrderDetailsUiResponse,
  OrderRouteParams,
  { rejectValue: UiErrorPayload }
>(
  'orders/fetchOrderDetailsById',
  async ({ category, orderId }, { rejectWithValue }) => {
    try {
      if (!orderId) {
        return rejectWithValue({
          message: 'Missing orderId for order details request.',
          type: ErrorType.Validation,
        });
      }

      if (!category) {
        return rejectWithValue({
          message: 'Missing order category for order details request.',
          type: ErrorType.Validation,
        });
      }

      const response = await orderService.fetchOrderDetailsById({
        category: category.trim(),
        orderId: orderId.trim(),
      });

      return {
        ...response,
        data: {
          header: normalizeSalesOrderHeader(response.data),
          items: flattenOrderItems(response.data.items),
        },
      };
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/* ------------------------------------------------------------------ */
/* Update Order Status */
/* ------------------------------------------------------------------ */

/**
 * Updates the status of an existing order.
 *
 * Responsibilities:
 * - Calls orderService.updateOrderStatus
 * - Returns updated order and item statuses
 * - Standardizes error handling
 *
 * @param params     - Route parameters (category, orderId)
 * @param data       - Status update payload ({ statusCode })
 */
export const updateOrderStatusThunk = createAsyncThunk<
  UpdateOrderStatusResponse,
  { params: OrderRouteParams; data: { statusCode: string } },
  { rejectValue: UiErrorPayload }
>('orders/updateOrderStatus', async ({ params, data }, { rejectWithValue }) => {
  try {
    return await orderService.updateOrderStatus(params, data);
  } catch (error: unknown) {
    console.error('updateOrderStatusThunk error:', {
      params,
      data,
      error,
    });

    return rejectWithValue(extractUiErrorPayload(error));
  }
});
