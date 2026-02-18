import type {
  ActorIdentity,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { NullableString } from '@shared-types/shared';
import type { ReduxPaginatedState } from '@shared-types/pagination';

/* ============================================================================
 * VALUE OBJECTS
 * ============================================================================
 */

/**
 * Represents a quantity value with unit.
 * All numeric values are serialized as strings to preserve decimal precision.
 */
export interface QuantityValue {
  value: string;   // decimal string (e.g. "100.000")
  unit: string;    // e.g. "pcs"
}

/**
 * Represents cost-related monetary information.
 * Decimal precision is preserved as string for accounting safety.
 */
export interface MoneyValue {
  unitCost: string;     // decimal string
  currency: string;     // ISO currency code (e.g. "CAD")
  exchangeRate: string; // decimal string
  totalCost: string;    // decimal string
}

/* ============================================================================
 * SNAPSHOT REFERENCES
 * ============================================================================
 */

/**
 * Snapshot of the packaging material reference at time of batch creation.
 * This ensures historical immutability even if master data changes.
 */
export interface PackagingMaterialSnapshot {
  id: string;
  code: string;
  category: string;
}

/**
 * Snapshot of supplier reference associated with the batch.
 */
export interface SupplierSnapshot {
  id: string;
  name: string;
  isPreferred: boolean;
  leadTimeDays: number;
}

/**
 * Snapshot of material naming context captured at intake.
 */
export interface MaterialSnapshot {
  internalName: string;
  supplierLabel: string;
}

/* ============================================================================
 * LIFECYCLE
 * ============================================================================
 */

/**
 * Represents lifecycle-related timestamps and intake metadata.
 *
 * `manufactureDate` and `expiryDate` may be null depending on
 * packaging material category.
 */
export interface PackagingMaterialBatchLifecycle {
  manufactureDate: NullableString;
  expiryDate: NullableString;
  receivedAt: string; // ISO timestamp
  receivedBy: ActorIdentity;
}

/* ============================================================================
 * DOMAIN DTO (API CONTRACT)
 * ============================================================================
 */

/**
 * Canonical domain representation of a packaging material batch.
 *
 * This is the shape returned by backend APIs.
 * It is nested, normalized, and domain-oriented.
 *
 * This type MUST remain backend-aligned and should not be mutated
 * for UI performance concerns.
 */
export interface PackagingMaterialBatch {
  id: string;
  lotNumber: string;
  
  material: MaterialSnapshot;
  quantity: QuantityValue;
  lifecycle: PackagingMaterialBatchLifecycle;
  cost: MoneyValue;
  status: GenericStatus;
  packagingMaterial: PackagingMaterialSnapshot;
  supplier: SupplierSnapshot;
  audit: GenericAudit;
}

/* ============================================================================
 * FILTER CONTRACT
 * ============================================================================
 */

/**
 * Supported filter parameters for packaging material batch queries.
 * These are passed inside `filters` within query params.
 */
export interface PackagingMaterialBatchFilters {
  statusIds?: string | string[];
  packagingMaterialIds?: string | string[];
  supplierIds?: string | string[];
  
  lotNumber?: string;
  
  expiryAfter?: string;
  expiryBefore?: string;
  
  manufactureAfter?: string;
  manufactureBefore?: string;
  
  receivedAfter?: string;
  receivedBefore?: string;
  
  createdAfter?: string;
  createdBefore?: string;
  
  keyword?: string;
}

/* ============================================================================
 * SORT CONTRACT
 * ============================================================================
 */

/**
 * Allowed sort keys.
 *
 * Must remain aligned with backend `packagingMaterialBatchSortMap`.
 * Changing backend keys requires updating this union.
 */
export type PackagingMaterialBatchSortKey =
  | 'receivedAt'
  | 'lotNumber'
  | 'materialInternalName'
  | 'supplierLabelName'
  | 'manufactureDate'
  | 'expiryDate'
  | 'statusName'
  | 'statusDate'
  | 'quantity'
  | 'packagingMaterialCode'
  | 'packagingMaterialCategory'
  | 'supplierName'
  | 'isPreferredSupplier'
  | 'supplierLeadTime'
  | 'receivedBy'
  | 'createdAt'
  | 'defaultNaturalSort';

/**
 * Query parameter structure used when requesting paginated data.
 */
export interface PackagingMaterialBatchQueryParams
  extends PaginationParams,
    SortConfig {
  filters?: PackagingMaterialBatchFilters;
}

/* ============================================================================
 * UI PROJECTION (FLATTENED ROW MODEL)
 * ============================================================================
 */

/**
 * Flattened projection optimized for table rendering.
 *
 * This model:
 * - Eliminates deep nested access
 * - Aligns directly with backend sort keys
 * - Improves memoization and selector performance
 *
 * This should be produced by a transformer layer and stored in Redux.
 */
export interface FlattenedPackagingMaterialBatchRow {
  // Core identity
  id: string;
  lotNumber: string;
  
  // Material snapshot
  materialInternalName: string;
  supplierLabel: string;
  
  // Quantity
  quantityValue: string;
  quantityUnit: string;
  
  // Lifecycle
  manufactureDate: NullableString;
  expiryDate: NullableString;
  receivedAt: string;
  receivedById: NullableString;
  receivedByName: string;
  
  // Cost
  unitCost: string;
  currency: string;
  exchangeRate: string;
  totalCost: string;
  
  // Status
  statusId: string;
  statusName: string;
  statusDate: string;
  
  // Packaging material
  packagingMaterialId: string;
  packagingMaterialCode: string;
  packagingMaterialCategory: string;
  
  // Supplier
  supplierId: string;
  supplierName: string;
  isPreferredSupplier: boolean;
  supplierLeadTimeDays: number;
  
  // Audit
  createdAt: string;
  createdById: NullableString;
  createdByName: string;
  updatedAt: NullableString;
  updatedById: NullableString;
  updatedByName: string;
}

/* ============================================================================
 * API RESPONSE TYPES
 * ============================================================================
 */

/**
 * Raw API response shape (domain-level).
 */
export type PackagingMaterialBatchListApiResponse =
  PaginatedResponse<PackagingMaterialBatch>;

/**
 * Redux paginated state storing flattened projection rows.
 */
export type PaginatedPackagingMaterialBatchState =
  ReduxPaginatedState<FlattenedPackagingMaterialBatchRow>;

/**
 * UI-layer paginated response after transformation.
 */
export type PackagingMaterialBatchListUiResponse =
  PaginatedResponse<FlattenedPackagingMaterialBatchRow>;
