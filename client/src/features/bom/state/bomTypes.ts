import type {
  ApiSuccessResponse,
  AsyncState,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';

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
export interface PaginatedBomStateWithFilters extends ReduxPaginatedState<BomListItem> {
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
export type BomMaterialSupplyDetailsResponse =
  ApiSuccessResponse<BomMaterialSupplyData>;

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
  length_inch: number;
  width_inch: number;
  height_inch: number;
  weight_lb: number;
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
export interface BomMaterialSupplyDetailsState extends AsyncState<BomMaterialSupplyDetailsResponse | null> {
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
 * Represents a single BOM item with its associated supplier supply data
 * **and** production readiness (inventory) details.
 *
 * Used primarily in the BOM Overview page to merge data across
 * multiple domains — including base BOM item info, supplier supply
 * records, and readiness (batch-level inventory) status.
 *
 * Each `BomItemWithSupplyAndReadiness` entry corresponds to one
 * BOM item and combines:
 *  - **details:** Flattened core part/material metadata and production requirements.
 *  - **supplyDetails:** Linked supplier–batch combinations with cost, currency,
 *    and procurement information.
 *  - **readinessDetails:** Readiness-specific rows describing current stock,
 *    bottleneck status, and max producible units based on batch availability.
 *
 * This unified model enables the front end to display comprehensive,
 * per-item insights — such as supply coverage, inventory bottlenecks,
 * and part-level producibility — within the BOM Details Table or
 * its expanded row section.
 *
 * @interface BomItemWithSupplyAndReadiness
 *
 * @property {string} bomItemId - Unique identifier for the BOM item.
 * @property {FlattenedBomDetailRow} details - Flattened BOM item metadata
 *   (part info, category, required quantity, etc.).
 * @property {FlattenedBomSupplyRow[]} supplyDetails - List of supplier or
 *   batch supply records linked to this item (used in Supply Info tables).
 * @property {FlattenedBomReadinessPartRow[]} readinessDetails - List of
 *   readiness records derived from inventory availability and production
 *   constraint calculations for this item.
 *
 * @example
 * const record: BomItemWithSupplyAndReadiness = {
 *   bomItemId: 'f123abc4-5678-9def-0123-456789abcdef',
 *   details: flattenedBomDetails[0],
 *   supplyDetails: flattenedSupplyRows.filter(s => s.bomItemId === 'f123abc4-5678-9def-0123-456789abcdef'),
 *   readinessDetails: flattenedReadinessRows.filter(r => r.partId === flattenedBomDetails[0].partId),
 * };
 */
export interface BomItemWithSupplyAndReadiness {
  bomItemId: string;
  details: FlattenedBomDetailRow;
  supplyDetails: FlattenedBomSupplyRow[];
  readinessDetails: FlattenedBomReadinessPartRow[];
}

/** Root response structure for BOM Production Readiness Summary */
export type BomProductionReadinessResponse =
  ApiSuccessResponse<BomProductionReadinessData>;

/** Core data object containing metadata and part-level readiness details */
export interface BomProductionReadinessData {
  bomId: string;
  metadata: BomReadinessMetadata;
  parts: BomReadinessPart[];
}

/** Metadata section summarizing overall readiness and production capacity */
export interface BomReadinessMetadata {
  /** Timestamp when readiness was calculated */
  generatedAt: string;
  /** Whether all required parts have sufficient stock to start production */
  isReadyForProduction: boolean;
  /** Maximum number of finished units producible given current stock */
  maxProducibleUnits: number;
  /** Parts that limit production output (lowest availability) */
  bottleneckParts: BomBottleneckPart[];
  /** Aggregated stock health summary */
  stockHealth: StockHealth;
  /** Total count of parts currently in shortage */
  shortageCount: number;
}

/**
 * Represents a part identified as a bottleneck for BOM production readiness.
 * Includes enriched display and material metadata for UI and reporting.
 */
export interface BomBottleneckPart {
  /** Unique identifier of the part */
  partId: string;

  /** Human-readable part name (e.g., "Bottle", "Capsule") */
  partName: string;

  /** Related packaging material name, if available (e.g., "250ml Plastic Bottle") */
  packagingMaterialName: string | null;

  /** Snapshot or version name of the material record, if applicable */
  materialSnapshotName: string | null;

  /** Human-readable display label, typically from received label or fallback to partName */
  displayLabel: string;
}

/** Indicates overall usable vs inactive inventory across all parts */
export interface StockHealth {
  usable: number;
  inactive: number;
}

/** Lightweight summary of BOM readiness for quick UI display */
export interface BomReadinessSummary {
  /** True if production can start (no shortages) */
  isReady: boolean;
  /** Maximum producible finished units given current stock */
  maxUnits: number;
  /** Number of bottleneck parts limiting production */
  bottleneckCount: number;
}

/** Detailed readiness record for each BOM part and its associated material batches */
export interface BomReadinessPart {
  partId: string;
  partName: string;
  /** Quantity of this part required per finished product unit */
  requiredQtyPerUnit: number;
  /** Total quantity of the part available in stock */
  totalAvailableQuantity: number;
  /** Maximum producible finished units constrained by this part */
  maxProducibleUnits: number;
  /** Whether the part is currently in shortage */
  isShortage: boolean;
  /** Quantity shortfall, if any */
  shortageQty: number;
  /** Material batches linked to this part */
  materialBatches: MaterialBatch[];
  /** Whether this part is the bottleneck limiting production */
  isBottleneck: boolean;
}

/** Represents an available batch of a specific packaging material or component */
export interface MaterialBatch {
  materialBatchId: string;
  materialName: string;
  materialSnapshotName: string;
  receivedLabelName: string;
  lotNumber: string;
  batchQuantity: number;
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  /** Inventory status (e.g., 'in_stock', 'reserved', 'inactive') */
  inventoryStatus: string;
  warehouseName: string;
  supplierName: string;
  inboundDate: string;
  lastUpdate: string;
}

/**
 * Represents the Redux slice state for **BOM Production Readiness Summary**.
 *
 * Tracks API loading status, potential errors, and the full readiness summary
 * payload from `fetchBomProductionSummaryThunk`.
 *
 * Used by:
 * - BOM Production Summary Page
 * - Production Planning and Readiness dashboards
 * - Manufacturing Preparation / Readiness Reports
 */
export interface BomProductionReadinessState extends AsyncState<BomProductionReadinessResponse | null> {
  /**
   * The currently selected BOM ID whose readiness summary is being viewed.
   * Helps maintain UI context between BOM overview and readiness pages.
   */
  selectedBomId: string | null;

  /**
   * Indicates whether the current BOM is production-ready,
   * derived from the response metadata for quick reference.
   */
  isReadyForProduction: boolean;

  /**
   * Tracks the total number of parts currently identified as bottlenecks.
   * Useful for alerting and readiness score calculations.
   */
  bottleneckCount: number;
}

/**
 * Flattened row type for table display, derived only from parts and their batches.
 */
export interface FlattenedBomReadinessPartRow extends Partial<MaterialBatch> {
  partId: string;
  partName: string;
  requiredQtyPerUnit: number;
  totalAvailableQuantity: number;
  maxProducibleUnits: number;
  isBottleneck: boolean;
  isShortage: boolean;
  shortageQty: number;
  packagingMaterialName?: string;
}

/**
 * Represents a unified view of batch-level information across
 * supplier data, readiness data, or merged combined data sources.
 *
 * This structure enables the frontend to render unified inventory/batch tables
 * regardless of whether the data originates from supply, readiness, or merged contexts.
 */
export interface UnifiedBatchRow {
  /** Source of the batch record — defines data origin */
  source: 'supplier' | 'readiness' | 'merged';

  /** Unique batch identifier (can map to supplier or readiness batch IDs) */
  batchId: string;

  /** Lot number or production batch code */
  lotNumber: string;

  /** Associated supplier name, if available */
  supplierName?: string;

  /** Associated warehouse name or storage location */
  warehouseName?: string;

  /** Quantity currently available for allocation or production */
  availableQuantity?: number;

  /** Quantity already reserved or allocated */
  reservedQuantity?: number;

  /** Date when batch was received or recorded inbound */
  inboundDate?: string | null;

  /** Current inventory status (e.g., 'in_stock', 'inactive', 'reserved') */
  inventoryStatus?: string;

  /** Cost per unit in original currency */
  unitCost?: number | null;

  /** Currency of the unit cost (e.g., 'CAD', 'USD') */
  currency?: string | null;

  /** Related BOM part identifier */
  partId?: string;

  /** Human-readable BOM part name */
  partName?: string;

  /** Related packaging material name, if applicable */
  packagingMaterialName?: string;

  /** Flag indicating whether this batch is a bottleneck in production */
  isBottleneck?: boolean;

  /** Flag indicating whether this batch is in shortage */
  isShortage?: boolean;

  /** Maximum producible units limited by this batch */
  maxProducibleUnits?: number;

  /** Quantity shortfall relative to required units */
  shortageQty?: number;

  /** Original flattened supply row reference for traceability or tooltips */
  sourceSupply?: FlattenedBomSupplyRow;

  /** Original flattened readiness row reference for traceability or tooltips */
  sourceReadiness?: FlattenedBomReadinessPartRow;
}

/**
 * Flattened structure representing BOM-level readiness metadata
 * for display in summary cards, tables, or export operations.
 *
 * This provides a single-layer, human-readable view derived from
 * the backend `BomReadinessMetadata` object.
 */
export interface FlattenedBomReadinessMetadata {
  /** ISO timestamp when readiness was last calculated */
  readinessGeneratedAt: string | null;

  /** Indicates whether all parts are sufficient to begin production */
  readinessStatus: boolean | null;

  /** Maximum producible finished units given current stock levels */
  readinessMaxUnits: number | null;

  /** Total count of parts currently in shortage */
  readinessShortageCount: number | null;

  /** Aggregated stock health summary in text form (e.g., "usable: 9850, inactive: 0") */
  readinessStockHealthSummary: string | null;

  /** Comma-separated list of bottleneck part names */
  readinessBottleneckPartNames: string | null;

  /** Comma-separated list of bottleneck material names */
  readinessBottleneckMaterialName: string | null;

  /** Comma-separated list of bottleneck material snapshot names */
  readinessBottleneckMaterialSnapshotName: string | null;

  /** Optional count of bottleneck parts limiting production output */
  readinessBottleneckCount?: number | null;
}
