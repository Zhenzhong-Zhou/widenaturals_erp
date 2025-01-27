import axiosInstance from '@utils/axiosConfig.ts';
import { API_ENDPOINTS } from './apiEndponits.ts';
import { ProductResponse } from '../features/product';

const fetchProducts = async <T>(page: number = 1, limit: number = 10): Promise<ProductResponse<T>> => {
  try {
    // Pass query parameters dynamically
    const response = await axiosInstance.get<ProductResponse<T>>(API_ENDPOINTS.ALL_PRODUCTS, {
      params: {
        page,
        limit,
      },
    });
    console.log('products: ', response.data);
    return response.data; // Return the main data object
  } catch (error: any) {
    console.error('Failed to fetch products:', error);
    throw new Error(error.response?.data?.message || 'Error fetching products');
  }
};

export const productService = {
 fetchProducts,
};
