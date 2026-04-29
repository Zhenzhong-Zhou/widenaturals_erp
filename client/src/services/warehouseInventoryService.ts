/**
 * @file warehouseInventoryService.ts
 *
 * API service for the Warehouse Inventory domain.
 * All HTTP calls to warehouse inventory endpoints are centralised here.
 */

import type {
  AdjustWarehouseInventoryQuantityRequest,
  AdjustWarehouseInventoryQuantityResponse,
  CreateWarehouseInventoryRequest,
  CreateWarehouseInventoryResponse,
  InventoryActivityLogQueryParams,
  PaginatedInventoryActivityLogApiResponse,
  PaginatedWarehouseInventoryApiResponse,
  RecordWarehouseInventoryOutboundRequest,
  RecordWarehouseInventoryOutboundResponse,
  UpdateWarehouseInventoryMetadataRequest,
  UpdateWarehouseInventoryMetadataResponse,
  UpdateWarehouseInventoryStatusRequest,
  UpdateWarehouseInventoryStatusResponse,
  WarehouseInventoryDetailResponse,
  WarehouseInventoryQueryParams,
  WarehouseItemSummaryQueryParams,
  WarehouseItemSummaryResponse,
  WarehouseSummaryResponse,
} from '@features/warehouseInventory';
import { buildQueryString, flattenListQueryParams } from '@utils/query';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, patchRequest, postRequest } from '@utils/http';

/**
 * Fetch a paginated list of warehouse inventory records with optional filters and sorting.
 *
 * READ-only operation.
 */
const fetchPaginatedWarehouseInventory = async (
  params: WarehouseInventoryQueryParams
): Promise<PaginatedWarehouseInventoryApiResponse> => {
  const { warehouseId, ...queryParams } = params;
  const flatParams = flattenListQueryParams(queryParams, []);
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.WAREHOUSE_INVENTORY.ALL_RECORDS(warehouseId)}${queryString}`;
  
  return getRequest<PaginatedWarehouseInventoryApiResponse>(url, {
    policy: 'READ',
  });
};

/**
 * Create one or more warehouse inventory records.
 *
 * Issues:
 *   POST /:warehouseId/inventory
 *
 * Notes:
 * - Accepts a bulk payload with 1–200 records.
 * - Errors are propagated as normalized AppError instances by the transport layer.
 *
 * @param warehouseId - Target warehouse UUID.
 * @param payload - Inventory records to create.
 * @returns API response containing the created inventory record(s).
 * @throws {AppError} When the request fails.
 */
const createWarehouseInventory = async (
  warehouseId: string,
  payload: CreateWarehouseInventoryRequest
): Promise<CreateWarehouseInventoryResponse> => {
  return postRequest<CreateWarehouseInventoryRequest, CreateWarehouseInventoryResponse>(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.CREATE(warehouseId),
    payload
  );
};

/**
 * Adjust quantities for one or more warehouse inventory records.
 *
 * Issues:
 *   PATCH /:warehouseId/inventory/quantities
 *
 * @param warehouseId - Target warehouse UUID.
 * @param payload - Bulk quantity adjustment records.
 * @returns API response containing the updated inventory record(s).
 * @throws {AppError} When the request fails.
 */
const adjustWarehouseInventoryQuantities = async (
  warehouseId: string,
  payload: AdjustWarehouseInventoryQuantityRequest
): Promise<AdjustWarehouseInventoryQuantityResponse> => {
  return patchRequest<
    AdjustWarehouseInventoryQuantityRequest,
    AdjustWarehouseInventoryQuantityResponse
  >(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.QUANTITIES(warehouseId),
      payload
  );
};

/**
 * Update statuses for one or more warehouse inventory records.
 *
 * Issues:
 *   PATCH /:warehouseId/inventory/statuses
 *
 * @param warehouseId - Target warehouse UUID.
 * @param payload - Bulk status update records.
 * @returns API response containing the updated inventory record(s).
 * @throws {AppError} When the request fails.
 */
const updateWarehouseInventoryStatuses = async (
  warehouseId: string,
  payload: UpdateWarehouseInventoryStatusRequest
): Promise<UpdateWarehouseInventoryStatusResponse> => {
  return patchRequest<
    UpdateWarehouseInventoryStatusRequest,
    UpdateWarehouseInventoryStatusResponse
  >(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.STATUSES(warehouseId),
      payload
  );
};

/**
 * Update metadata for a single warehouse inventory record.
 *
 * Issues:
 *   PATCH /:warehouseId/inventory/:inventoryId/metadata
 *
 * @param warehouseId - Target warehouse UUID.
 * @param inventoryId - Target inventory record UUID.
 * @param payload - Metadata fields to update.
 * @returns API response containing the updated inventory record.
 * @throws {AppError} When the request fails.
 */
const updateWarehouseInventoryMetadata = async (
  warehouseId: string,
  inventoryId: string,
  payload: UpdateWarehouseInventoryMetadataRequest
): Promise<UpdateWarehouseInventoryMetadataResponse> => {
  return patchRequest<
    UpdateWarehouseInventoryMetadataRequest,
    UpdateWarehouseInventoryMetadataResponse
  >(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.METADATA(warehouseId, inventoryId),
      payload
  );
};

/**
 * Record outbound for one or more warehouse inventory records.
 *
 * Issues:
 *   POST /:warehouseId/inventory/outbound
 *
 * @param warehouseId - Target warehouse UUID.
 * @param payload - Bulk outbound records.
 * @returns API response containing the updated inventory record(s).
 * @throws {AppError} When the request fails.
 */
const recordWarehouseInventoryOutbound = async (
  warehouseId: string,
  payload: RecordWarehouseInventoryOutboundRequest
): Promise<RecordWarehouseInventoryOutboundResponse> => {
  return postRequest<
    RecordWarehouseInventoryOutboundRequest,
    RecordWarehouseInventoryOutboundResponse
  >(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.OUTBOUND(warehouseId),
      payload
  );
};

/**
 * Fetch detail for a single warehouse inventory record.
 *
 * Issues:
 *   GET /:warehouseId/inventory/:inventoryId
 *
 * @param warehouseId - Target warehouse UUID.
 * @param inventoryId - Target inventory record UUID.
 * @returns API response containing the full inventory detail record.
 * @throws {AppError} When the request fails.
 */
const fetchWarehouseInventoryDetail = async (
  warehouseId: string,
  inventoryId: string
): Promise<WarehouseInventoryDetailResponse> => {
  return getRequest<WarehouseInventoryDetailResponse>(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.DETAIL(warehouseId, inventoryId),
    { policy: 'READ' }
  );
};

/**
 * Fetch a paginated list of inventory activity log records.
 *
 * Issues:
 *   GET /:warehouseId/inventory/activity-log
 *
 * @param params - Query parameters including warehouseId, pagination, sorting, and filters.
 * @returns Paginated API response containing activity log records.
 * @throws {AppError} When the request fails.
 */
const fetchInventoryActivityLog = async (
  params: InventoryActivityLogQueryParams
): Promise<PaginatedInventoryActivityLogApiResponse> => {
  const { warehouseId, ...queryParams } = params;
  const flatParams = flattenListQueryParams(queryParams, []);
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.WAREHOUSE_INVENTORY.ACTIVITY_LOG(warehouseId)}${queryString}`;
  
  return getRequest<PaginatedInventoryActivityLogApiResponse>(url, {
    policy: 'READ',
  });
};

/**
 * Fetch the aggregate summary for a single warehouse.
 *
 * Issues:
 *   GET /:warehouseId/summary
 *
 * @param warehouseId - Target warehouse UUID.
 * @returns API response containing the warehouse summary.
 * @throws {AppError} When the request fails.
 */
const fetchWarehouseSummary = async (
  warehouseId: string
): Promise<WarehouseSummaryResponse> => {
  return getRequest<WarehouseSummaryResponse>(
    API_ENDPOINTS.WAREHOUSE_INVENTORY.SUMMARY(warehouseId),
    { policy: 'READ' }
  );
};

/**
 * Fetch the item-level summary for a single warehouse.
 *
 * Issues:
 *   GET /:warehouseId/summary/items
 *
 * @param params - Query parameters including warehouseId and optional batch type filter.
 * @returns API response containing product and packaging material summaries.
 * @throws {AppError} When the request fails.
 */
const fetchWarehouseItemSummary = async (
  params: WarehouseItemSummaryQueryParams
): Promise<WarehouseItemSummaryResponse> => {
  const { warehouseId, ...queryParams } = params;
  const flatParams = flattenListQueryParams(queryParams, []);
  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.WAREHOUSE_INVENTORY.SUMMARY_ITEMS(warehouseId)}${queryString}`;
  
  return getRequest<WarehouseItemSummaryResponse>(url, {
    policy: 'READ',
  });
};

export const warehouseInventoryService = {
  fetchPaginatedWarehouseInventory,
  createWarehouseInventory,
  adjustWarehouseInventoryQuantities,
  updateWarehouseInventoryStatuses,
  updateWarehouseInventoryMetadata,
  recordWarehouseInventoryOutbound,
  fetchWarehouseInventoryDetail,
  fetchInventoryActivityLog,
  fetchWarehouseSummary,
  fetchWarehouseItemSummary,
};
