import { useEffect, useState } from 'react';
import { fetchProductDetails } from '../services/productService';
import { Product } from '../features/product';

interface UseProductDetailResult {
  product: Product | null; // The fetched product details
  isLoading: boolean; // Whether the product details are being fetched
  error: string | null; // Error message if any
  refetchProduct: () => void; // Function to refetch the product details
}

/**
 * Custom hook to fetch and manage product details by ID.
 *
 * @param {string} productId - The ID of the product to fetch.
 * @returns {UseProductDetailResult} - Product details, loading state, error state, and refetch function.
 */
const useProductDetail = (productId: string): UseProductDetailResult => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product details
  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProduct = await fetchProductDetails(productId);
      setProduct(fetchedProduct);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product details');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch product details on mount and when productId changes
  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Return the product details, loading state, error, and refetch function
  return {
    product,
    isLoading,
    error,
    refetchProduct: fetchProduct,
  };
};

export default useProductDetail;
