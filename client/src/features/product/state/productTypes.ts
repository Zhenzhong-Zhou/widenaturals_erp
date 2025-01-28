// Define Product Interface
export interface Product {
  id: string;
  product_name: string;
  series?: string;
  brand?: string;
  category?: string;
  SKU: string;
  barcode?: string;
  market_region?: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_g: number;
  description?: string;
  status_id: string;
  status_date: string;
  created_at: string;
  updated_at: string;
  created_by_fullname?: string;
  updated_by_fullname?: string;
  status_name: string; // Active, inactive, etc.
  prices: Array<{
    pricing_type: string; // Retail, MSRP, etc.
    price: number;
  }>;
}

// Define the structure of the API response
export interface ProductResponse<T> {
  data: T[]; // Array of product data, either full or general
  pagination: Pagination;
  success: boolean;
}

// Define the initial state type
export interface ProductState<T> {
  data: T[]; // Either FullProductDetails or GeneralProductInfo
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

export interface UseProductsOptions {
  initialPage?: number; // Initial page number
  itemsPerPage?: number; // Number of items per page
}

export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface UseProductsResult<T> {
  products: T[]; // Either FullProductDetails or GeneralProductInfo
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  fetchProductsByPage: (options?: { page?: number; limit?: number; category?: string; name?: string }) => Promise<void>;
}

// Define a subset type for general product info
export type GeneralProductInfo = {
  id: string;
  product_name: string;
  series?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  market_region?: string;
  status_name: string; // Active, inactive, etc.
  prices: Array<{
    pricing_type: string; // Retail, MSRP, etc.
    price: number;
  }>;
};

export interface ProductDetailApiResponse {
  success: boolean;
  data: Product;
}

export interface ProductDetailState {
  productDetail: Product | null;
  loading: boolean;
  error: string | null;
}