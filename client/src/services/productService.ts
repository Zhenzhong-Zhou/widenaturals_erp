import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import {
  Product,
  ProductResponse,
  ProductDetailApiResponse,
} from '@features/product';

const fetchProducts = async <T>(
  page: number = 1,
  limit: number = 10
): Promise<ProductResponse<T>> => {
  try {
    // Pass query parameters dynamically
    const response = await axiosInstance.get<ProductResponse<T>>(
      API_ENDPOINTS.ALL_PRODUCTS,
      {
        params: {
          page,
          limit,
        },
      }
    );
    return response.data; // Return the main data object
  } catch (error: any) {
    console.error('Failed to fetch products:', error);
    throw new Error(error.response?.data?.message || 'Error fetching products');
  }
};

/**
 * Fetch product details by ID
 *
 * @param {string} productId - The ID of the product to fetch
 * @returns {Promise<Product>} - Returns the product details
 * @throws {Error} - Throws an error if the request fails
 */
const fetchProductDetails = async (productId: string): Promise<Product> => {
  try {
    const endpoint = API_ENDPOINTS.PRODUCT_DETAILS.replace(':id', productId);
    const response =
      await axiosInstance.get<ProductDetailApiResponse>(endpoint);
    if (!response.data.success) {
      throw new Error('Failed to fetch product details');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching product details:', error.message);
    throw new Error(
      error.response?.data?.message || 'Error fetching product details'
    );
  }
};

export const productService = {
  fetchProducts,
  fetchProductDetails,
};
