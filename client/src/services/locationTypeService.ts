import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import {
  LocationTypeResponse,
  LocationTypesResponse,
} from '../features/locationTypes';

/**
 * Fetches all location types from the server.
 * @returns {Promise<LocationTypesResponse>} A promise that resolves to the location types data.
 * @throws {Error} Throws an error if the request fails.
 */
const fetchAllLocationTypes = async (
  page: number,
  limit: number
): Promise<LocationTypesResponse> => {
  try {
    const response = await axiosInstance.get<LocationTypesResponse>(
      `${API_ENDPOINTS.ALL_LOCATION_TYPES}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching location types:', error);
    throw new Error('Failed to fetch location types.');
  }
};

const fetchLocationTypeDetailById = async (
  id: string,
  page: number,
  limit: number
): Promise<LocationTypeResponse> => {
  try {
    const endpoint = API_ENDPOINTS.LOCATION_TYPE_DETAILS.replace(':id', id);
    const response = await axiosInstance.get<LocationTypeResponse>(
      `${endpoint}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    throw new Error('Error fetching location type details.');
  }
};

export const locationTypeService = {
  fetchAllLocationTypes,
  fetchLocationTypeDetailById,
};
