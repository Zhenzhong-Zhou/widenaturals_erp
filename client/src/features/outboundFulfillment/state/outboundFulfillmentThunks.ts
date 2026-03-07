/**
 * ================================================================
 * Outbound Fulfillment Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates outbound shipment and fulfillment workflows.
 * - Serves as the business boundary between UI and outboundFulfillmentService.
 *
 * Scope:
 * - Initiate outbound fulfillment
 * - Fetch paginated shipment records
 * - Fetch shipment details
 * - Confirm fulfillment
 * - Complete manual fulfillment
 *
 * Architecture:
 * - API calls delegated to outboundFulfillmentService
 * - UI normalization occurs at the thunk boundary
 * - Redux reducers remain pure and state-focused
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 *
 * Design Rules:
 * - No component logic
 * - No persistence logic
 * - Raw API models do not leak into Redux/UI
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CompleteManualFulfillmentParams,
  CompleteManualFulfillmentResponse,
  ConfirmOutboundFulfillmentRequest,
  ConfirmOutboundFulfillmentResponse,
  FetchShipmentDetailsUiResponse,
  InitiateFulfillmentRequest,
  InitiateFulfillmentResponse,
  OutboundFulfillmentQuery,
  PaginatedOutboundFulfillmentsResponse,
} from '@features/outboundFulfillment/state';
import { outboundFulfillmentService } from '@services/outboundFulfillmentService';
import {
  flattenFulfillments,
  flattenShipmentHeader,
} from '@features/outboundFulfillment/utils';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';
import { flattenOutboundShipment } from '@features/outboundFulfillment/utils/flattenOutboundShipment';

/**
 * Initiates outbound fulfillment for an order.
 *
 * Responsibilities:
 * - Calls outboundFulfillmentService.initiateOutboundFulfillment
 * - Returns service response directly
 * - Standardizes errors via `UiErrorPayload`
 *
 * @param request - Initiation payload including orderId and allocation data
 */
export const initiateOutboundFulfillmentThunk = createAsyncThunk<
  InitiateFulfillmentResponse,
  InitiateFulfillmentRequest,
  { rejectValue: UiErrorPayload }
>('outboundFulfillments/initiate', async (request, { rejectWithValue }) => {
  try {
    return await outboundFulfillmentService.initiateOutboundFulfillment(
      request
    );
  } catch (error: unknown) {
    console.error('initiateOutboundFulfillmentThunk error:', {
      request,
      error,
    });

    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches a paginated list of outbound shipments.
 *
 * Responsibilities:
 * - Calls outboundFulfillmentService.fetchPaginatedOutboundFulfillment
 * - Flattens shipment rows before entering Redux state
 * - Preserves pagination metadata
 *
 * Transformation Boundary:
 * - Raw shipment model → flattenOutboundShipment → UI model
 *
 * @param queryParams - Pagination, sorting, and filtering options
 */
export const fetchPaginatedOutboundFulfillmentThunk = createAsyncThunk<
  PaginatedOutboundFulfillmentsResponse,
  OutboundFulfillmentQuery,
  { rejectValue: UiErrorPayload }
>(
  'outboundFulfillment/fetchPaginated',
  async (queryParams, { rejectWithValue }) => {
    try {
      const response =
        await outboundFulfillmentService.fetchPaginatedOutboundFulfillment(
          queryParams
        );

      return {
        ...response,
        data: response.data.map(flattenOutboundShipment),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Fetches outbound shipment details and converts
 * the response into a UI-ready structure.
 *
 * Responsibilities:
 * - Calls outboundFulfillmentService.fetchOutboundShipmentDetails
 * - Normalizes shipment header and fulfillments
 *
 * Transformation Boundary:
 * - Shipment → flattenShipmentHeader
 * - Fulfillments → flattenFulfillments
 *
 * @param shipmentId - Shipment UUID
 */
export const fetchOutboundShipmentDetailsThunk = createAsyncThunk<
  FetchShipmentDetailsUiResponse,
  string,
  { rejectValue: UiErrorPayload }
>('outboundShipments/fetchDetails', async (shipmentId, { rejectWithValue }) => {
  try {
    const response =
      await outboundFulfillmentService.fetchOutboundShipmentDetails(shipmentId);

    return {
      success: response.success,
      message: response.message,
      traceId: response.traceId,
      data: {
        shipment: flattenShipmentHeader(response.data.shipment),
        fulfillments: flattenFulfillments(response.data.fulfillments),
      },
    };
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Confirms an outbound fulfillment.
 *
 * Responsibilities:
 * - Calls outboundFulfillmentService.confirmOutboundFulfillment
 * - Finalizes fulfillment, shipment, and order states
 * - Standardizes error handling
 *
 * @param request - Confirmation payload
 */
export const confirmOutboundFulfillmentThunk = createAsyncThunk<
  ConfirmOutboundFulfillmentResponse,
  ConfirmOutboundFulfillmentRequest,
  { rejectValue: UiErrorPayload }
>(
  'outboundFulfillment/confirmOutboundFulfillment',
  async (request, { rejectWithValue }) => {
    try {
      return await outboundFulfillmentService.confirmOutboundFulfillment(
        request
      );
    } catch (error: unknown) {
      console.error('confirmOutboundFulfillmentThunk error:', {
        request,
        error,
      });

      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Completes a manual outbound fulfillment (e.g., pickup or direct delivery).
 *
 * Responsibilities:
 * - Calls outboundFulfillmentService.completeManualFulfillment
 * - Finalizes shipment, fulfillment, and order statuses
 * - Returns confirmation result
 *
 * @param params - Shipment ID and final status payload
 */
export const completeManualFulfillmentThunk = createAsyncThunk<
  CompleteManualFulfillmentResponse,
  CompleteManualFulfillmentParams,
  { rejectValue: UiErrorPayload }
>(
  'outboundFulfillments/completeManual',
  async (params, { rejectWithValue }) => {
    try {
      return await outboundFulfillmentService.completeManualFulfillment(params);
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
