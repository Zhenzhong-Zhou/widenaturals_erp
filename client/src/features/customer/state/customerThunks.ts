import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateCustomersRequest,
  CreateCustomerResponse,
  PaginatedCustomerListResponse,
  FetchPaginatedCustomersParams,
} from './customerTypes';
import { customerService } from '@services/customerService';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Redux async thunk to create one or more customers.
 *
 * Responsibilities:
 * - Delegates creation logic to `customerService.createCustomers`
 * - Supports bulk creation via array input
 * - Automatically manages pending / fulfilled / rejected lifecycle
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - All thrown errors are normalized using `extractUiErrorPayload`
 * - Ensures consistent UI-safe error handling across slices
 *
 * @param customers - Array of customers to create.
 * @returns A fulfilled action containing {@link CreateCustomerResponse}.
 *
 * @example
 * dispatch(createCustomersThunk([
 *   { name: 'Acme Corp', region: 'CA' }
 * ]));
 */
export const createCustomersThunk = createAsyncThunk<
  CreateCustomerResponse,
  CreateCustomersRequest,
  { rejectValue: UiErrorPayload }
>('customers/create', async (customers, { rejectWithValue }) => {
  try {
    return await customerService.createCustomers(customers);
  } catch (error: unknown) {
    console.error('createCustomersThunk error:', error);
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Redux async thunk to fetch paginated customer records.
 *
 * Responsibilities:
 * - Delegates data fetching to `customerService.fetchPaginatedCustomers`
 * - Supports pagination, sorting, and filtering
 * - Returns backend pagination metadata unchanged
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - Errors are normalized via `extractUiErrorPayload`
 * - Guarantees consistent reducer-level error handling
 *
 * @param params - Pagination, sorting, and filter configuration.
 * @returns A fulfilled action containing {@link PaginatedCustomerListResponse}.
 *
 * @example
 * dispatch(fetchPaginatedCustomersThunk({
 *   page: 1,
 *   limit: 20,
 *   filters: { region: 'CA' }
 * }));
 */
export const fetchPaginatedCustomersThunk = createAsyncThunk<
  PaginatedCustomerListResponse,
  FetchPaginatedCustomersParams,
  { rejectValue: UiErrorPayload }
>('customers/fetchPaginated', async (params, { rejectWithValue }) => {
  try {
    return await customerService.fetchPaginatedCustomers(params);
  } catch (error: unknown) {
    console.error('fetchPaginatedCustomersThunk error:', error);
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
