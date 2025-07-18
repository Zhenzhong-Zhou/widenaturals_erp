import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import type {
  FetchPricingParams,
  PaginatedPricingDetailsResponse,
  PaginatedPricingRecordsResponse,
} from '@features/pricing/state';
import type { PriceRequestParams, PriceResponse } from '@features/pricing';
import { saveAs } from 'file-saver';

/**
 * Fetch paginated pricing records with optional filters and sorting.
 *
 * @param params - Query options: page, limit, sortBy, filters, keyword.
 * @returns Paginated list of pricing records.
 */
const fetchPaginatedPricingRecords = async (
  params: FetchPricingParams = {}
): Promise<PaginatedPricingRecordsResponse> => {
  try {
    const { filters = {}, ...rest } = params;

    const flatParams = {
      ...rest,
      ...filters,
    };

    const response = await axiosInstance.get<PaginatedPricingRecordsResponse>(
      API_ENDPOINTS.PRICING_LIST,
      { params: flatParams }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pricing records', error);
    throw new Error('Failed to fetch pricing records');
  }
};

/**
 * Export pricing records with filters and selected format.
 *
 * @param params - FetchPricingParams with optional filters, keyword, etc.
 * @param exportFormat - Desired file format for export (csv, xlsx, txt).
 * @returns A Blob for file download.
 */
const exportPricingRecords = async (
  params: FetchPricingParams = {},
  exportFormat: 'csv' | 'xlsx' | 'txt'
): Promise<Blob> => {
  try {
    const { filters = {}, ...rest } = params;

    const queryParams = {
      ...rest, // page, limit, keyword, sortBy, etc.
      ...filters, // flatten filters
      exportFormat, // additional export option
    };

    const response = await axiosInstance.get<Blob>(
      API_ENDPOINTS.PRICING_LIST_EXPORT,
      {
        params: queryParams,
        responseType: 'blob',
      }
    );

    // Extract filename from Content-Disposition
    const disposition = response.headers['content-disposition'];
    let filename = 'pricing-export.csv';

    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Save the file
    saveAs(response.data, filename);

    return response.data;
  } catch (error) {
    console.error('Failed to export pricing records', error);
    throw new Error('Failed to export pricing records');
  }
};

/**
 * Fetches paginated pricing details by pricing type ID.
 *
 * @param pricingTypeId - The UUID of the pricing type to filter by.
 * @param [page=1] - The current page number.
 * @param [limit=10] - Number of records per page.
 * @returns {Promise<PaginatedPricingDetailsResponse>} - Resolved pricing details and pagination info.
 * @throws {Error} - Throws an error if the request fails.
 */
const fetchPricingDetailsByType = async (
  pricingTypeId: string,
  page = 1,
  limit = 10
): Promise<PaginatedPricingDetailsResponse> => {
  try {
    const endpoint = API_ENDPOINTS.PRICING_DETAILS_BY_TYPE.replace(
      ':id',
      pricingTypeId
    );
    const response = await axiosInstance.get<PaginatedPricingDetailsResponse>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch pricing details');
  }
};

const fetchPriceByProductIdAndPriceTypeId = async (
  params: PriceRequestParams
): Promise<PriceResponse> => {
  try {
    const response = await axiosInstance.get<PriceResponse>(
      API_ENDPOINTS.PRICE_VALUE,
      {
        params,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch price:', error);
    throw new Error('Failed to fetch price');
  }
};

export const pricingService = {
  fetchPaginatedPricingRecords,
  exportPricingRecords,
  fetchPricingDetailsByType,
  fetchPriceByProductIdAndPriceTypeId,
};
