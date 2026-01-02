/**
 * BOM service.
 *
 * All network errors are normalized and propagated as AppError
 * instances by the transport layer.
 */

import type {
  BomDetailsResponse,
  BomMaterialSupplyDetailsResponse,
  BomProductionReadinessResponse,
  FetchBomsParams,
  FetchPaginatedBomsResponse,
} from '@features/bom/state/bomTypes';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { buildQueryString } from '@utils/buildQueryString';
import { getRequest } from '@utils/http';

/**
 * Fetch a paginated and filtered list of BOMs.
 *
 * Issues `GET /boms` with optional query parameters for pagination,
 * sorting, and filtering. Errors are propagated as normalized AppError
 * instances by the transport layer.
 *
 * @param params - Optional pagination, sorting, and filtering parameters.
 * @returns A paginated list of BOMs with metadata.
 * @throws {AppError} When the request fails.
 */
const fetchPaginatedBoms = async (
  params: FetchBomsParams = {}
): Promise<FetchPaginatedBomsResponse> => {
  const { filters = {}, ...rest } = params;

  const flatParams = {
    ...rest,
    ...filters,
  };

  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.BOMS.ALL_RECORDS}${queryString}`;

  return getRequest<FetchPaginatedBomsResponse>(url);
};

/**
 * Fetch detailed information for a specific BOM.
 *
 * Issues `GET /boms/:bomId/details` to retrieve the full BOM structure.
 *
 * @param bomId - Unique BOM identifier.
 * @returns Detailed BOM data.
 * @throws {AppError} When the request fails.
 */
const fetchBomDetails = async (bomId: string): Promise<BomDetailsResponse> => {
  return getRequest<BomDetailsResponse>(API_ENDPOINTS.BOMS.BOM_DETAILS(bomId));
};

/**
 * Fetch material supply details for a specific BOM.
 *
 * Issues `GET /bom-items/:bomId/material-supply`.
 *
 * @param bomId - Unique BOM identifier.
 * @returns Material supply details including cost and batch breakdowns.
 * @throws {AppError} When the request fails.
 */
const fetchBomMaterialSupplyDetails = async (
  bomId: string
): Promise<BomMaterialSupplyDetailsResponse> => {
  return getRequest<BomMaterialSupplyDetailsResponse>(
    API_ENDPOINTS.BOMS.BOM_MATERIAL_SUPPLY_DETAILS(bomId)
  );
};

/**
 * Fetch production readiness summary for a specific BOM.
 *
 * Issues `GET /boms/:bomId/production-summary`.
 *
 * @param bomId - Unique BOM identifier.
 * @returns Production readiness summary and bottleneck analysis.
 * @throws {AppError} When the request fails.
 */
const fetchBomProductionSummary = async (
  bomId: string
): Promise<BomProductionReadinessResponse> => {
  return getRequest<BomProductionReadinessResponse>(
    API_ENDPOINTS.BOMS.BOM_PRODUCTION_SUMMARY(bomId)
  );
};

export const bomService = {
  fetchPaginatedBoms,
  fetchBomDetails,
  fetchBomMaterialSupplyDetails,
  fetchBomProductionSummary,
};
