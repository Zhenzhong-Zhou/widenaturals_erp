import type {
  BomDetailsResponse,
  BomMaterialSupplyDetailsResponse,
  BomProductionReadinessResponse,
  FetchBomsParams,
  FetchPaginatedBomsResponse,
} from '@features/bom/state/bomTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/apiRequest';

/**
 * Fetch a paginated and filtered list of BOMs.
 *
 * Issues `GET /boms` with optional query parameters for pagination, sorting, and filters.
 *
 * Notes:
 * - Nested `filters` are flattened into top-level query keys before serialization.
 * - Expects a standard paginated API response structure.
 *
 * @param params - Optional pagination, sorting, and filtering parameters.
 * @returns A promise resolving to a paginated list of BOMs with metadata.
 * @throws Rethrows any network or parsing error from the request helper.
 *
 * @example
 * const res = await bomService.fetchPaginatedBoms({
 *   page: 1,
 *   limit: 10,
 *   filters: { isActive: true },
 * });
 * console.log(res.data[0].bom.code);
 */
const fetchPaginatedBoms = async (
  params: FetchBomsParams = {}
): Promise<FetchPaginatedBomsResponse> => {
  const { filters = {}, ...rest } = params;

  // Flatten nested filters into top-level query keys
  const flatParams = {
    ...rest,
    ...filters,
  };

  // Build full URL with query string
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.BOMS.ALL_RECORDS}${queryString}`;

  try {
    return await getRequest<FetchPaginatedBomsResponse>(url);
  } catch (error) {
    console.error('Failed to fetch BOM list:', { params: flatParams, error });
    throw error;
  }
};

/**
 * Fetch detailed information for a specific BOM.
 *
 * Issues `GET /boms/:bomId/details` to retrieve the full BOM structure,
 * including product, SKU, compliance, and part breakdowns.
 *
 * Notes:
 * - Returns header, detailed parts list, and summary cost data.
 * - Used by the BOM Details page and related inspection views.
 *
 * @param bomId - The unique identifier of the BOM to fetch.
 * @returns A promise resolving to detailed BOM data.
 * @throws Rethrows any network or parsing error from the request helper.
 *
 * @example
 * const res = await bomService.fetchBomDetails('61bb1f94-aeb2-4724-b9b8-35023b165fdd');
 * console.log(res.data.header.product.name);
 */
const fetchBomDetails = async (bomId: string): Promise<BomDetailsResponse> => {
  const url = API_ENDPOINTS.BOMS.BOM_DETAILS(bomId);

  try {
    return await getRequest<BomDetailsResponse>(url);
  } catch (error) {
    console.error('Failed to fetch BOM details:', { bomId, error });
    throw error;
  }
};

/**
 * Fetch material supply details for a specific BOM.
 *
 * Issues `GET /bom-items/:bomId/material-supply` to retrieve
 * the full supplier, cost, and batch breakdown for all BOM items.
 *
 * Notes:
 * - Returns summary totals (per supplier and part) and detailed
 *   material-level data including contracts, exchange rates, and batches.
 * - Used by the BOM Material Supply Details page and cost analysis views.
 *
 * @param bomId - The unique identifier of the BOM whose supply details to fetch.
 * @returns A promise resolving to {@link BomMaterialSupplyDetailsResponse} containing
 *          summary and detailed material cost structures.
 * @throws Rethrows any network or parsing error encountered during the request.
 *
 * @example
 * const res = await bomService.fetchBomMaterialSupplyDetails('cbbf2680-2730-4cb1-a38e-ce32f93609c1');
 * console.log(res.data.summary.totals.totalEstimatedCost);
 */
const fetchBomMaterialSupplyDetails = async (
  bomId: string
): Promise<BomMaterialSupplyDetailsResponse> => {
  const url = API_ENDPOINTS.BOMS.BOM_MATERIAL_SUPPLY_DETAILS(bomId);

  try {
    return await getRequest<BomMaterialSupplyDetailsResponse>(url);
  } catch (error) {
    console.error('Failed to fetch BOM Material Supply Details:', {
      bomId,
      error,
    });
    throw error;
  }
};

/**
 * Fetch production readiness summary for a specific BOM.
 *
 * Issues `GET /boms/:bomId/production-summary` to retrieve
 * readiness metrics including:
 * - Maximum producible units (based on part availability)
 * - Bottleneck parts limiting production
 * - Stock health and shortage overview
 * - Detailed part-level material batch data
 *
 * Notes:
 * - Used by the BOM Production Readiness / Production Summary page.
 * - Provides both summary-level and detailed readiness breakdowns.
 *
 * @param bomId - The unique identifier of the BOM whose production readiness to fetch.
 * @returns A promise resolving to {@link BomProductionReadinessResponse} containing
 *          readiness metadata, bottleneck parts, and detailed material stock info.
 * @throws Rethrows any network or parsing error encountered during the request.
 *
 * @example
 * const res = await bomService.fetchBomProductionSummary('2a3bbd18-e63a-42b7-aa63-b6b4b6d416b4');
 * console.log(res.data.metadata.maxProducibleUnits);
 */
const fetchBomProductionSummary = async (
  bomId: string
): Promise<BomProductionReadinessResponse> => {
  const url = API_ENDPOINTS.BOMS.BOM_PRODUCTION_SUMMARY(bomId);

  try {
    return await getRequest<BomProductionReadinessResponse>(url);
  } catch (error) {
    console.error('Failed to fetch BOM Production Summary:', { bomId, error });
    throw error;
  }
};

export const bomService = {
  fetchPaginatedBoms,
  fetchBomDetails,
  fetchBomMaterialSupplyDetails,
  fetchBomProductionSummary,
};
