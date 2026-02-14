import type {
  ActorIdentity,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { NullableString } from '@shared-types/shared';
import { ReduxPaginatedState } from '@shared-types/pagination';

/**
 * Paginated API response for product batch listing.
 * Used by batch registry, allocation, and inventory views.
 */
export type PaginatedProductBatchApiResponse =
  PaginatedResponse<ProductBatchRecord>;

/**
 * Core product batch domain record.
 * Represents a manufactured lot tied to a SKU and product.
 */
export interface ProductBatchRecord {
  /** Unique batch identifier (UUID) */
  id: string;
  
  /** Manufacturer-provided lot number */
  lotNumber: string;
  
  /** SKU identity (operational unit) */
  sku: ProductBatchSku;
  
  /** Product metadata (display + classification) */
  product: ProductBatchProduct;
  
  /** Manufacturing source */
  manufacturer: ProductBatchManufacturer;
  
  /** Manufacturing and lifecycle dates */
  lifecycle: ProductBatchLifecycle;
  
  /** Current batch status (id, name, effective date) */
  status: GenericStatus;
  
  /** Timestamp when batch was released/approved for use */
  releasedAt: NullableString;
  
  /** Actor identity who registered the batch */
  releasedBy: ActorIdentity;
  
  /** Audit metadata (created/updated) */
  audit: GenericAudit;
}

/**
 * SKU identity attached to a batch.
 * This is the primary operational identifier.
 */
export interface ProductBatchSku {
  id: string;
  code: string;
  sizeLabel: string;
}

/**
 * Product metadata for display and classification.
 */
export interface ProductBatchProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  displayName: string;
}

/**
 * Manufacturer reference.
 * Permission-gated in some views.
 */
export interface ProductBatchManufacturer {
  id: string;
  name: string;
}

/**
 * Lifecycle dates and initial quantity at manufacture.
 */
export interface ProductBatchLifecycle {
  manufactureDate: NullableString;
  expiryDate: NullableString;
  receivedDate: NullableString;
  
  /** Quantity produced at manufacturing time */
  initialQuantity: number;
}

/**
 * Filter options for querying product batches.
 * These map 1:1 to backend validation schema.
 */
export interface ProductBatchFilters {
  /** Filter by batch status IDs */
  statusIds?: string | string[];
  
  /** Filter by SKU IDs */
  skuIds?: string | string[];
  
  /** Filter by product IDs */
  productIds?: string | string[];
  
  /** Filter by manufacturer IDs */
  manufacturerIds?: string | string[];
  
  /** Exact lot number match */
  lotNumber?: string;
  
  /** Expiry date range */
  expiryAfter?: string;
  expiryBefore?: string;
  
  /** Manufacture date range */
  manufactureAfter?: string;
  manufactureBefore?: string;
  
  /** Received date range */
  receivedAfter?: string;
  receivedBefore?: string;
  
  /** Audit creation date range */
  createdAfter?: string;
  createdBefore?: string;
  
  /** Keyword search (lot, product, SKU, manufacturer) */
  keyword?: string;
}

/**
 * Allowed sort fields for product batch listing.
 * Must remain in sync with backend sort map.
 */
export type ProductBatchSortField =
  | 'createdAt'
  | 'lotNumber'
  
  // SKU
  | 'skuCode'
  | 'sizeLabel'
  | 'countryCode'
  
  // Product
  | 'productName'
  | 'productBrand'
  | 'productCategory'
  
  // Manufacturer
  | 'manufacturerName'
  
  // Lifecycle
  | 'manufactureDate'
  | 'expiryDate'
  | 'receivedDate'
  
  // Quantity
  | 'initialQuantity'
  
  // Status
  | 'statusName'
  | 'statusDate'
  
  // Release
  | 'releasedAt'
  | 'releasedBy'
  
  // Audit
  | 'updatedAt'
  
  // Fallback
  | 'defaultNaturalSort';

/**
 * Query parameters for product batch listing API.
 * Combines pagination, sorting, and domain filters.
 */
export interface ProductBatchQueryParams
  extends PaginationParams, SortConfig {
    filters?: ProductBatchFilters;
}

/**
 * UI-ready flattened product batch record.
 * Optimized for tables, sorting, and filtering.
 */
export interface FlattenedProductBatchRecord {
  /** Batch identity */
  id: string;
  lotNumber: string;
  
  /** SKU */
  skuId: string;
  skuCode: string;
  sizeLabel: string;
  
  /** Product */
  productId: string;
  productName: string;
  productBrand: string;
  productCategory: string;
  productDisplayName: string;
  
  /** Manufacturer */
  manufacturerId: string;
  manufacturerName: string;
  
  /** Lifecycle */
  manufactureDate: string | null;
  expiryDate: string | null;
  receivedDate: string | null;
  initialQuantity: number;
  
  /** Status */
  statusId: string;
  statusName: string;
  statusDate: string;
  
  /** Release */
  releasedAt: string | null;
  releasedByName: string;
  
  /** Audit */
  createdAt: string;
  createdByName: string;
  updatedAt: string | null;
  updatedByName: string | null;
}

/**
 * Redux paginated state for product batch listing.
 *
 * Holds UI-ready, flattened records along with pagination,
 * loading, and error metadata.
 *
 * Used by:
 * - Batch Registry list page
 * - Inventory allocation batch selectors
 * - Any table-based batch views
 */
export type PaginatedProductBatchState =
  ReduxPaginatedState<FlattenedProductBatchRecord>;

/**
 * Paginated API response for product batch list endpoints.
 *
 * This represents the normalized API payload after
 * client-side transformation (flattening).
 *
 * Used by:
 * - RTK Query endpoints
 * - Async thunks
 * - Service-layer fetch helpers
 */
export type PaginatedProductBatchListResponse =
  PaginatedResponse<FlattenedProductBatchRecord>;
