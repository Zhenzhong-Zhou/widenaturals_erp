import {
  GetPaginatedComplianceRecordsParams,
  PaginatedComplianceRecordResponse
} from '@features/complianceRecord/state';
import { buildQueryString } from '@utils/buildQueryString';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/apiRequest';

/**
 * Fetch a paginated list of compliance records.
 *
 * Issues:
 *   GET /compliance-records?page={page}&limit={limit}&sortBy={col}&sortOrder={order}&...
 *
 * Standard response:
 *   PaginatedResponse<ComplianceRecord>
 *
 * Notes:
 * - Filters are provided in `params.filters`
 * - Date ranges are flattened into top-level query params
 *   (e.g. issuedFrom / issuedTo)
 *
 * @param params - Pagination, sorting, and compliance filter options
 * @returns A promise resolving to paginated compliance records
 * @throws Rethrows any request helper error
 *
 * @example
 * const res = await fetchPaginatedComplianceRecords({
 *   page: 1,
 *   limit: 10,
 *   filters: {
 *     type: 'NPN',
 *     keyword: '8010',
 *     dateRanges: {
 *       issued: { from: '2025-01-01', to: '2025-12-31' }
 *     }
 *   }
 * });
 */
const fetchPaginatedComplianceRecords = async (
  params: GetPaginatedComplianceRecordsParams = {}
): Promise<PaginatedComplianceRecordResponse> => {
  const { filters = {}, ...rest } = params;
  
  const {
    dateRanges,
    ...otherFilters
  } = filters;
  
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
  
  // Merge everything into top-level query params
  const flatParams = {
    ...rest,
    ...otherFilters,
    ...flatDateParams,
  };
  
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.COMPLIANCE_RECORDS.ALL_RECORDS}${queryString}`;
  
  try {
    return await getRequest<PaginatedComplianceRecordResponse>(url);
  } catch (error) {
    console.error('Failed to fetch compliance records:', {
      params,
      error,
    });
    throw error;
  }
};

export const complianceRecordService = {
  fetchPaginatedComplianceRecords,
};
