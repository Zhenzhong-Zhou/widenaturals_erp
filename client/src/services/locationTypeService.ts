import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { LocationTypesResponse } from '../features/locationTypes';



/**
 * Fetches all location types from the server.
 * @returns {Promise<LocationTypesResponse>} A promise that resolves to the location types data.
 * @throws {Error} Throws an error if the request fails.
 */
const fetchAllLocationTypes = async (page: number, limit: number): Promise<LocationTypesResponse> => {
  try {
    const response = await axiosInstance.get<LocationTypesResponse>(`${API_ENDPOINTS.ALL_LOCATION_TYPES}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching location types:', error);
    throw new Error('Failed to fetch location types.');
  }
};

export const locationTypeService = {
  fetchAllLocationTypes,
};
