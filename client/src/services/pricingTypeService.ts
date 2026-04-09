/**
 * @file pricingTypeService.ts
 * @description HTTP service functions for pricing type data retrieval.
 * Covers paginated list queries and single record detail fetches.
 */

import type {
  PaginatedPricingTypeApiResponse,
  PricingTypeDetailApiResponse,
  PricingTypeQueryParams,
} from '@features/pricingType';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { sanitizeString } from '@utils/stringUtils';

/**
 * Fetch a paginated list of pricing types with optional filters and sorting.
 *
 * READ-only operation.
 */
const fetchPaginatedPricingTypes = async (
  params: PricingTypeQueryParams = {}
): Promise<PaginatedPricingTypeApiResponse> => {
  const flatParams = flattenListQueryParams(params, [
    'createdAfter',
    'createdBefore',
  ]);
  
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.PRICING_TYPES.ALL_RECORDS}${queryString}`;
  
  return getRequest<PaginatedPricingTypeApiResponse>(url, {
    policy: 'READ',
  });
};

/**
 * Fetch full pricing type details by ID.
 *
 * READ-only operation.
 */
const fetchPricingTypeDetailsById = (
  pricingTypeId: string
): Promise<PricingTypeDetailApiResponse> => {
  const cleanId = sanitizeString(pricingTypeId);
  
  return getRequest<PricingTypeDetailApiResponse>(
    API_ENDPOINTS.PRICING_TYPES.PRICING_TYPE_DETAILS(cleanId),
    { policy: 'READ' }
  );
};

export const pricingTypeService = {
  fetchPaginatedPricingTypes,
  fetchPricingTypeDetailsById,
};
