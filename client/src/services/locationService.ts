import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { LocationResponse } from '../features/location';
import { AppError } from '@utils/AppError.tsx';

/**
 * Fetch all locations from the API with pagination.
 * @param {number} page - Current page number
 * @param {number} limit - Number of results per page
 * @returns {Promise<LocationResponse>} - Returns typed location data with pagination
 */
const fetchAllLocations = async (page: number, limit: number): Promise<LocationResponse> => {
  try {
    const response = await axiosInstance.get<LocationResponse>(
      `${API_ENDPOINTS.ALL_LOCATIONS}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw new AppError('Failed to fetch locations');
  }
};

// Export the location service with structured API calls
export const locationService = {
  fetchAllLocations,
};
