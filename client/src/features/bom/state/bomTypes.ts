import type {
  ApiSuccessResponse, AsyncState,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

/**
 * Root response shape for the paginated BOM list API.
 *
 * Extends the generic `PaginatedResponse<T>` for consistency
 * with all paginated ERP endpoints.
 */
export type FetchPaginatedBomsResponse = PaginatedResponse<BomListItem>;

/**
 * Represents one row in the BOM list.
 * Each row includes linked product, SKU, and BOM metadata.
 */
export interface BomListItem {
  product: ProductSummary;
  sku: SkuSummary;
  bom: BomRow;
}

/**
 * Basic product information linked to a BOM.
 */
export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  series: string;
  category: string;
}

/**
 * SKU-level information associated with a product.
 */
export interface SkuSummary {
  id: string;
  code: string;
  barcode: string;
  language: string;
  countryCode: string;
  marketRegion: string;
  sizeLabel: string;
  description: string;
  compliance: ComplianceInfo | null;
}

/**
 * Compliance metadata (e.g., NPN, FDA, etc.)
 */
export interface ComplianceInfo {
  id: string;
  type: string; // e.g., 'NPN'
  number: string;
  status: string; // e.g., 'active'
  issuedDate: string; // ISO timestamp
  expiryDate?: string | null; // optional future-proofing
}

/**
 * BOM core information.
 */
export interface BomRow {
  id: string;
  code: string;
  name: string;
  revision: number;
  isActive: boolean;
  isDefault: boolean;
  description: string | null;
  status: BomStatus;
  audit: AuditRecord;
}

/**
 * BOM status and last updated info.
 */
export interface BomStatus {
  id: string;
  name: string; // e.g., 'active', 'inactive'
  date: string; // ISO timestamp
}

/**
 * Created/updated audit info for a BOM.
 */
export interface AuditRecord {
  createdAt: string;
  createdBy: BasicUserRef;
  updatedAt: string | null;
  updatedBy: BasicUserRef | null;
}

/**
 * Lightweight user reference for audit info.
 */
export interface BasicUserRef {
  id: string;
  name: string;
}

/**
 * Supported sort fields for BOM list.
 */
export type BomSortField =
  | 'productName'
  | 'brand'
  | 'series'
  | 'category'
  | 'skuCode'
  | 'complianceType'
  | 'complianceStatus'
  | 'revision'
  | 'isActive'
  | 'isDefault'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'defaultNaturalSort';

/**
 * Filter parameters for fetching BOM list.
 * Mirrors `bomQuerySchema` from the backend.
 */
export interface BomListFilters {
  // --- Core Filters ---
  showBarcode?: boolean;
  skuId?: string | null;
  
  // --- Compliance Filters ---
  complianceStatusId?: string;
  onlyActiveCompliance?: boolean;
  complianceType?: string;
  
  // --- BOM Status ---
  statusId?: string;
  
  // --- Boolean flags ---
  isActive?: boolean;
  isDefault?: boolean;
  
  // --- Revision Range ---
  revisionMin?: number;
  revisionMax?: number;
  
  // --- Audit filters ---
  createdBy?: string;
  updatedBy?: string;
  
  // --- Keyword search ---
  keyword?: string;
}

/**
 * Complete query parameters for fetching BOM list,
 * combining pagination, sorting, and filter support.
 */
export interface FetchBomsParams extends PaginationParams, SortConfig {
  filters?: BomListFilters;
}

/**
 * Redux slice state for the BOM module.
 *
 * Extends the generic `ReduxPaginatedState<T>` for standardized pagination,
 * loading, and error handling, while adding module-specific fields
 * like filters and sort configuration.
 */
export interface PaginatedBomStateWithFilters
  extends ReduxPaginatedState<BomListItem> {
  /** Current applied filters for the BOM list (e.g., status, brand, productName). */
  filters: FetchBomsParams['filters'];
}

/**
 * Flattened BOM record structure used for tables or exports.
 */
export interface FlattenedBomRecord {
  // Product Info
  productId: string;
  productName: string;
  brand: string;
  series: string;
  category: string;
  
  // SKU Info
  skuId: string;
  skuCode: string;
  barcode: string;
  marketRegion: string;
  countryCode: string;
  language: string;
  sizeLabel: string;
  skuDescription: string;
  
  // BOM Info
  bomId: string;
  bomCode: string;
  bomName: string;
  bomDescription: string;
  revision: number;
  isActive: boolean;
  isDefault: boolean;
  
  // Status Info
  status: string;
  statusDate: string;
  
  // Compliance Info
  npnNumber: string;
  complianceType: string;
  complianceIssuedDate: string | null;
  complianceExpiryDate: string | null;
  
  // Audit Info
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Response type for the BOM Details API: GET /boms/:bomId/details
 */
export type BomDetailsResponse = ApiSuccessResponse<BomDetailsData>;

/** Root data payload returned by the BOM Details API. */
export interface BomDetailsData {
  header: BomHeader;
  details: BomPartDetail[];
  summary: BomSummary;
}

/** Contains high-level product, SKU, compliance, and BOM information. */
export interface BomHeader {
  product: BomProduct;
  sku: BomSku;
  compliance: BomCompliance;
  bom: BomInfo;
}

/** Represents the core product associated with the BOM. */
export interface BomProduct {
  id: string;
  name: string;
  brand: string;
  series: string;
  category: string;
}

/** Represents the SKU (variant) details for the product. */
export interface BomSku {
  id: string;
  code: string;
  barcode: string;
  language: string;
  countryCode: string;
  marketRegion: string;
  sizeLabel: string;
  description: string;
}

/** Regulatory or compliance information linked to the SKU. */
export interface BomCompliance {
  id: string;
  type: string; // e.g., 'NPN'
  number: string;
  issuedDate: string | null;
  expiryDate: string | null;
  description: string;
  status: BomStatus;
}

/** Describes the Bill of Materials record itself. */
export interface BomInfo {
  id: string;
  code: string;
  name: string;
  revision: number;
  isActive: boolean;
  isDefault: boolean;
  description: string;
  status: BomStatusWithDate;
  audit: AuditRecord;
}

/** Represents the current status of the BOM or compliance record. */
export interface BomStatus {
  id: string;
  name: string; // e.g., 'active'
}

/** Extends status with the date of the last update. */
export interface BomStatusWithDate extends BomStatus {
  date: string;
}

/** Represents a specific part and its usage within the BOM. */
export interface BomPartDetail {
  id: string;
  partQtyPerProduct: number;
  unit: string;
  specifications: string | null;
  estimatedUnitCost: number;
  currency: string; // e.g., 'CAD', 'USD', etc.
  exchangeRate: number; // rate relative to CAD
  note: string | null;
  part: BomPart;
  audit: AuditRecord;
}

/** Defines a reusable part or material in the BOM structure. */
export interface BomPart {
  id: string;
  code: string;
  name: string;
  type: string;
  unitOfMeasure: string;
  description: string;
}

/** Summarized BOM cost and item count information. */
export interface BomSummary {
  type: 'ESTIMATED' | 'ACTUAL' | string;
  description: string;
  totalEstimatedCost: number;
  currency: string; // normalized currency (CAD)
  itemCount: number;
}

/**
 * Slice state for storing a single BOM's detailed structure and metadata.
 */
export type BomDetailsState = AsyncState<BomDetailsData | null>;

/**
 * A flattened representation of BOM header data,
 * merging product, SKU, compliance, and BOM metadata
 * into a single-level structure for easy display and export.
 */
export interface FlattenedBomHeader {
  // --- Product Info ---
  productId: string | null;
  productName: string | null;
  productBrand: string | null;
  productSeries: string | null;
  productCategory: string | null;
  
  // --- SKU Info ---
  skuId: string | null;
  skuCode: string | null;
  skuBarcode: string | null;
  skuLanguage: string | null;
  skuCountryCode: string | null;
  skuMarketRegion: string | null;
  skuSizeLabel: string | null;
  skuDescription: string | null;
  
  // --- Compliance Info ---
  complianceId: string | null;
  complianceType: string | null;
  complianceNumber: string | null;
  complianceIssuedDate: string | null;
  complianceExpiryDate: string | null;
  complianceDescription: string | null;
  complianceStatus: string | null;
  
  // --- BOM Info ---
  bomId: string | null;
  bomCode: string | null;
  bomName: string | null;
  bomRevision: number | null;
  bomIsActive: boolean | null;
  bomIsDefault: boolean | null;
  bomDescription: string | null;
  bomStatus: string | null;
  bomStatusDate: string | null;
  bomCreatedAt: string | null;
  bomCreatedBy: string | null;
  bomUpdatedAt: string | null;
  bomUpdatedBy: string | null;
}

/**
 * Represents a flattened view of a BOM summary,
 * suitable for display or tabular export.
 */
export interface FlattenedBomSummary {
  /** Summary type, e.g. "ESTIMATED" or "ACTUAL". */
  summaryType: string | null;
  
  /** Description of how the summary was calculated. */
  summaryDescription: string | null;
  
  /** Total cost normalized to CAD or a standard currency. */
  summaryTotalEstimatedCost: number | null;
  
  /** The currency used for total cost (e.g. "CAD"). */
  summaryCurrency: string | null;
  
  /** Total count of items in the BOM. */
  summaryItemCount: number | null;
}

/**
 * Type definition for a flattened BOM part detail row.
 * Derived from your flattening function result.
 */
export interface FlattenedBomDetailRow {
  bomItemId: string;
  partId: string | null;
  partCode: string | null;
  partName: string | null;
  partType: string | null;
  partQtyPerProduct: number | null;
  unit: string | null;
  partUnitOfMeasure: string | null;
  partDescription: string | null;
  estimatedUnitCost: number | null;
  currency: string | null;
  exchangeRate: number | null;
  specifications: string | null;
  note: string | null;
  estimatedCostCAD: number | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

/**
 * Standard API success response wrapper for BOM Material Supply Details.
 */
export type BomMaterialSupplyDetailsResponse = ApiSuccessResponse<BomMaterialSupplyData>;

/**
 * Main payload containing the summary and detailed breakdown
 * of BOM material supply data.
 */
export interface BomMaterialSupplyData {
  summary: BomMaterialSupplySummary;
  details: BomMaterialSupplyDetail[];
}

/**
 * Aggregated summary of BOM material costs,
 * including total variance and grouped totals by supplier and part.
 *
 * This structure aligns with the server response for
 * `calculateBomMaterialCostsBusiness` (Option B - preferred/first supplier mode).
 */
export interface BomMaterialSupplySummary {
  /** BOM identifier */
  bomId: string;
  
  /** Base currency used for normalization (e.g. "CAD") */
  baseCurrency: string;
  
  /** Overall BOM cost totals */
  totals: {
    /** Total estimated cost converted to base currency */
    totalEstimatedCost: number;
    /** Total actual cost (from batch/supplier) converted to base currency */
    totalActualCost: number;
    /** Difference between actual and estimated costs */
    variance: number;
    /** Variance percentage relative to estimated total */
    variancePercentage: number;
  };
  
  /** Supplier-level aggregated totals */
  suppliers: BomSupplierSummary[];
  
  /** Part-level aggregated totals */
  parts: BomPartSummary[];
}

/**
 * Supplier-level cost summary within a BOM.
 */
export interface BomSupplierSummary {
  /** Supplier unique ID */
  id: string;
  /** Supplier display name */
  name: string;
  /** Total actual cost (in base currency) for this supplier */
  supplierTotalActualCost: number;
}

/**
 * Part-level cost summary within a BOM.
 */
export interface BomPartSummary {
  /** Part unique ID */
  partId: string;
  /** Part display name (e.g., “Bottle”) */
  partName: string;
  /**
   * Actual material or packaging name linked to this part
   * (e.g., “250ml Plastic Bottle”, “Vegetable Capsule 0”).
   * Used for display and cost breakdown clarity.
   */
  materialName: string;
  /** Optional alias or material name for UI display (e.g., “250ml Plastic Bottle”) */
  displayName?: string | null;
  /** Total contract or actual cost (in base currency) for this part */
  partTotalContractCost: number;
}

/**
 * Detailed record for each BOM item, linking parts and their packaging materials.
 */
export interface BomMaterialSupplyDetail {
  bomId: string;
  bomItemId: string;
  part: BomPart;
  bomItemMaterial: BomItemMaterial;
  packagingMaterials: PackagingMaterial[];
}

/**
 * Basic information about the part associated with a BOM item.
 */
export interface BomPart {
  id: string;
  name: string;
}

/**
 * Defines the material and quantity requirements per BOM product unit.
 */
export interface BomItemMaterial {
  id: string;
  requiredQtyPerProduct: number;
  unit: string;
  note: string;
  status: StatusRecord;
  createdBy: BasicUserRef;
  updatedBy: BasicUserRef | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Represents a packaging material linked to a BOM part and supplier.
 */
export interface PackagingMaterial {
  id: string;
  name: string;
  code: string;
  color: string | null;
  size: string | null;
  grade: string | null;
  materialComposition: string | null;
  unit: string;
  category: string;
  isVisibleForSalesOrder: boolean;
  estimatedUnitCost: number;
  currency: string;
  exchangeRate: number;
  dimensions: MaterialDimensions;
  status: StatusRecord;
  audit: AuditRecord;
  supplier: SupplierDetail;
}

/**
 * Physical dimensions and weight of a packaging material.
 */
export interface MaterialDimensions {
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_g: number;
  length_inch: number,
  width_inch: number,
  height_inch: number,
  weight_lb: number,
}

/**
 * Detailed supplier information, including contract and available batches.
 */
export interface SupplierDetail {
  id: string;
  name: string;
  contract: SupplierContract;
  audit: AuditRecord;
  batches: PackagingMaterialBatch[];
}

/**
 * Supplier contract terms, including pricing, validity, and lead time.
 */
export interface SupplierContract {
  unitCost: number;
  currency: string;
  exchangeRate: number;
  validFrom: string;
  validTo: string;
  isPreferred: boolean;
  leadTimeDays: number;
  note: string | null;
}

/**
 * Represents a material batch received from a supplier, with cost and date info.
 */
export interface PackagingMaterialBatch {
  id: string;
  lotNumber: string;
  materialSnapshotName: string;
  receivedLabelName: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  unitCost: number;
  currency: string;
  exchangeRate: number;
  totalCost: number;
  status: StatusRecord;
  audit: AuditRecord;
}

/**
 * Status record with ID, name, and effective date.
 */
export interface StatusRecord {
  id: string;
  name: string;
  date: string;
}

/**
 * Represents the Redux slice state for BOM Material Supply Details.
 *
 * Tracks API loading status, potential errors, and the full response payload
 * from `fetchBomMaterialSupplyDetailsThunk`.
 *
 * Used by:
 * - BOM Material Supply Details Page
 * - BOM Cost Summary / Supplier Breakdown components
 */
export interface BomMaterialSupplyDetailsState
  extends AsyncState<BomMaterialSupplyDetailsResponse | null> {
  /**
   * The currently selected BOM ID whose supply details are loaded.
   * Useful for tracking active context between different BOM views.
   */
  selectedBomId: string | null;
}

/**
 * Flattened summary view of BOM material cost performance.
 *
 * Designed for table rows, dashboard cards, and overview reports.
 * Includes high-level BOM totals, top supplier, and top part information.
 */
export interface FlattenedBomMaterialSupplySummary {
  /** BOM identifier */
  bomId: string;
  
  /** Base currency used for cost normalization (e.g. "CAD") */
  baseCurrency: string;
  
  /** Total estimated material cost (converted to base currency) */
  totalEstimatedCost: number;
  
  /** Total actual material cost (converted to base currency) */
  totalActualCost: number;
  
  /** Difference between actual and estimated costs */
  variance: number;
  
  /** Variance percentage relative to estimated total */
  variancePercentage: number;
  
  /** Total number of unique suppliers contributing to this BOM */
  supplierCount: number;
  
  /** Total number of unique parts included in this BOM */
  partCount: number;
  
  /** Optional: Actual cost amount from the top supplier (in base currency) */
  topSupplierActualCost?: number;

  /** Optional: Actual cost amount for the top part (in base currency) */
  topPartActualCost?: number;
}

/**
 * Represents a flattened record for a single supplier batch associated with a BOM item material.
 */
export interface FlattenedBomSupplyRow {
  // --- BOM & Part Metadata ---
  bomId: string;
  bomItemId: string;
  partId: string;
  partName: string;
  
  // --- BOM Item Material Info ---
  bomItemMaterialId: string;
  requiredQtyPerProduct: number;
  bomUnit: string;
  materialNote: string | null;
  bomItemMaterialStatusName: string;
  bomItemMaterialStatusDate: string;
  bomItemMaterialCreatedAt: string;
  bomItemMaterialCreatedBy: string;
  bomItemMaterialUpdatedAt: string | null;
  bomItemMaterialUpdatedBy: string | null;
  
  // --- Packaging Material Info ---
  packagingMaterialId: string;
  packagingMaterialName: string;
  packagingMaterialCode: string;
  materialComposition: string | null;
  category: string;
  color: string | null;
  size: string | null;
  grade: string | null;
  estimatedUnitCost: number;
  materialCurrency: string;
  materialExchangeRate: number;
  isVisibleForSalesOrder: boolean;
  packagingMaterialLengthCm: number;
  packagingMaterialWidthCm: number;
  packagingMaterialHeightCm: number;
  packagingMaterialWeightG: number;
  packagingMaterialLengthInch: number;
  packagingMaterialWidthInch: number;
  packagingMaterialHeightInch: number;
  packagingMaterialWeightLbs: number;
  packagingMaterialStatusName: string;
  packagingMaterialStatusDate: string;
  packagingMaterialCreatedAt: string;
  packagingMaterialCreatedBy: string;
  packagingMaterialUpdatedAt: string | null;
  packagingMaterialUpdatedBy: string | null;
  
  // --- Supplier Info ---
  supplierId: string;
  supplierName: string;
  supplierContractUnitCost: number;
  supplierContractCurrency: string;
  supplierContractExchangeRate: number;
  supplierLeadTimeDays: number | null;
  supplierContractValidFrom: string;
  supplierContractValidTo: string;
  supplierPreferred: boolean;
  supplierNote: string | null;
  supplierCreatedAt: string;
  supplierCreatedBy: string;
  supplierUpdatedAt: string | null;
  supplierUpdatedBy: string | null;
  
  // --- Batch Info ---
  batchId: string;
  lotNumber: string;
  materialSnapshotName: string;
  receivedLabelName: string;
  unitCost: number;
  quantity: number;
  batchUnit: string;
  batchCurrency: string;
  batchExchangeRate: number;
  totalCost: number;
  manufactureDate: string;
  expiryDate: string;
  batchStatusName: string;
  batchStatusDate: string;
  batchCreatedAt: string;
  batchCreatedBy: string;
  batchUpdatedAt: string | null;
  batchUpdatedBy: string | null;
}

/**
 * Represents a single BOM item and its associated supplier/batch supply details.
 *
 * Used primarily in the BOM Overview and Supply Info modules to link
 * flattened BOM item data (`FlattenedBomDetailRow`) with its corresponding
 * supply records (`FlattenedBomSupplyRow[]`).
 *
 * Each `BomItemWithSupply` object corresponds to one BOM item, combining:
 *  - **details:** Core part/material metadata and production requirements.
 *  - **supplyDetails:** One or more supplier–batch combinations linked
 *    to that item, including cost, currency, and lead time info.
 *
 * @interface BomItemWithSupply
 *
 * @property {string} bomItemId - Unique identifier for the BOM item.
 * @property {FlattenedBomDetailRow} details - Flattened BOM item metadata
 *   (part, category, quantity per product, etc.).
 * @property {FlattenedBomSupplyRow[]} supplyDetails - List of supplier/batch
 *   records related to this BOM item, typically displayed in a mini-table
 *   within the expanded row of the BOM Details Table.
 *
 * @example
 * const record: BomItemWithSupply = {
 *   bomItemId: 'f123abc4-5678-9def-0123-456789abcdef',
 *   details: flattenedBomDetails[0],
 *   supplyDetails: flattenedSupplyRows.filter(s => s.bomItemId === 'f123abc4-5678-9def-0123-456789abcdef'),
 * };
 */
export interface BomItemWithSupply {
  bomItemId: string;
  details: FlattenedBomDetailRow;
  supplyDetails: FlattenedBomSupplyRow[];
}
