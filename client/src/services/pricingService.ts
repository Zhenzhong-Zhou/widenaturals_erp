/**
 * @file pricingService.ts
 * @description HTTP service functions for pricing join list and export.
 * Covers paginated list queries and file export downloads.
 */

import type {
  PaginatedPricingApiResponse,
  PricingQueryParams,
  PricingExportQueryParams,
} from '@features/pricing';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';

/**
 * Fetch a paginated list of joined pricing records with optional filters and sorting.
 *
 * READ-only operation.
 */
const fetchPaginatedPricing = async (
  params: PricingQueryParams = {}
): Promise<PaginatedPricingApiResponse> => {
  const flatParams = flattenListQueryParams(params, []);
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.PRICING.ALL_RECORDS}${queryString}`;
  
  return getRequest<PaginatedPricingApiResponse>(url, {
    policy: 'READ',
  });
};

/**
 * Download a pricing export file in the requested format.
 *
 * Returns a Blob for direct file download — no JSON payload.
 */
const exportPricing = async (
  params: PricingExportQueryParams = {}
): Promise<Blob> => {
  const flatParams = flattenListQueryParams(params, []);
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.PRICING.EXPORT_DATA}${queryString}`;
  
  return getRequest<Blob>(url, {
    policy: 'READ',
    config: { responseType: 'blob' },
  });
};

export const pricingService = {
  fetchPaginatedPricing,
  exportPricing,
};
