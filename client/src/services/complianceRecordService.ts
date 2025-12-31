import type {
  GetPaginatedComplianceRecordsParams,
  PaginatedComplianceRecordResponse
} from '@features/complianceRecord/state';
import { buildQueryString } from '@utils/buildQueryString';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';

/**
 * Fetch a paginated list of compliance records.
 *
 * Issues:
 *   GET /compliance-records with pagination, sorting, and filter parameters.
 *
 * Notes:
 * - Filters are provided in `params.filters`
 * - Nested date ranges are flattened into top-level query parameters
 *   (e.g. issued.from → issuedFrom, issued.to → issuedTo)
 * - Errors are propagated as normalized AppError instances by the transport layer
 *
 * @param params - Pagination, sorting, and compliance filter options.
 * @returns A paginated list of compliance records with metadata.
 * @throws {AppError} When the request fails.
 */
const fetchPaginatedComplianceRecords = async (
  params: GetPaginatedComplianceRecordsParams = {}
): Promise<PaginatedComplianceRecordResponse> => {
  const { filters = {}, ...rest } = params;
  
  const { dateRanges, ...otherFilters } = filters;
  
  /**
   * Flatten dateRanges → query params
   * issued.from → issuedFrom
   * issued.to   → issuedTo
   */
  const flatDateParams = dateRanges
    ? Object.entries(dateRanges).reduce<Record<string, string>>(
      (acc, [key, range]) => {
        if (!range) return acc;
        
        if (range.from) acc[`${key}From`] = range.from;
        if (range.to) acc[`${key}To`] = range.to;
        
        return acc;
      },
      {}
    )
    : {};
  
  const flatParams = {
    ...rest,
    ...otherFilters,
    ...flatDateParams,
  };
  
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.COMPLIANCE_RECORDS.ALL_RECORDS}${queryString}`;
  
  return getRequest<PaginatedComplianceRecordResponse>(url);
};

export const complianceRecordService = {
  fetchPaginatedComplianceRecords,
};
