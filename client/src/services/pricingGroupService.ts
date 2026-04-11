/**
 * @file pricingGroupService.ts
 * @description HTTP service functions for pricing group data retrieval.
 * Covers paginated list queries and single record detail fetches.
 */

import type {
  PaginatedPricingGroupApiResponse,
  PricingGroupQueryParams,
} from '@features/pricingGroup';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';

/**
 * Fetch a paginated list of pricing groups with optional filters and sorting.
 *
 * READ-only operation.
 */
const fetchPaginatedPricingGroups = async (
  params: PricingGroupQueryParams = {}
): Promise<PaginatedPricingGroupApiResponse> => {
  const flatParams = flattenListQueryParams(params, [
    'createdAfter',
    'createdBefore',
  ]);
  
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.PRICING_GROUPS.ALL_RECORDS}${queryString}`;
  
  return getRequest<PaginatedPricingGroupApiResponse>(url, {
    policy: 'READ',
  });
};

export const pricingGroupService = {
  fetchPaginatedPricingGroups,
};
