import type {
  ComplianceResponse,
  FetchAllCompliancesParams,
} from '@features/compliance';
import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';

/**
 * Fetch all compliance records with pagination and sorting.
 * @param params - Object containing page, limit, sortBy, and sortOrder.
 * @returns {Promise<ComplianceResponse>}
 */
const fetchAllCompliances = async (
  params: FetchAllCompliancesParams
): Promise<ComplianceResponse> => {
  try {
    const response = await axiosInstance.get<ComplianceResponse>(
      API_ENDPOINTS.ALL_COMPLIANCES,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching compliances:', error);
    throw new Error('Failed to fetch compliance data');
  }
};

export const complianceService = {
  fetchAllCompliances,
};
