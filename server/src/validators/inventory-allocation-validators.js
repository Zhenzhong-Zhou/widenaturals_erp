/**
 * Validation schemas for inventory allocation routes.
 *
 * Includes:
 * - allocateOrderIdSchema: Validates the route parameter `orderId`.
 * - allocateInventorySchema: Validates the request body payload containing
 *   allocation strategy and target warehouse.
 */

const Joi = require('joi');
const {
  validateString,
  validateUUID,
  validateUUIDArray,
  paginationSchema,
  createSortSchema,
  validateOptionalUUID,
  validateOptionalString,
  aggregatedDateRangeSchema,
  validateUUIDOrUUIDArrayOptional,
} = require('./general-validators');

/**
 * Validates the body of the inventory allocation request.
 *
 * Fields:
 * - strategy: 4-character allocation strategy (default: 'fefo')
 * - warehouseId: UUID of the warehouse where inventory will be allocated from
 *
 * Example body:
 * {
 *   "strategy": "fefo",
 *   "warehouseId": "123e4567-e89b-12d3-a456-426614174000"
 * }
 */
const allocateInventorySchema = Joi.object({
  strategy: validateString('Strategy', 4, 4).default('fefo'),
  warehouseId: validateUUID('Warehouse ID'),
});

/**
 * Joi schema to validate request body for inventory allocation review.
 *
 * Expected structure:
 * {
 *   warehouseIds: string[] // Required array of UUIDs (at least one)
 *   allocationIds: string[] // Required array of UUIDs (at least one)
 * }
 *
 * Validation Rules:
 * - Both `warehouseIds` and `allocationIds` are required.
 * - Each must be a non-empty array of valid UUID strings.
 * - Validation uses `validateUUIDArray(label, { required: true })` to enforce structure.
 *
 * @type {Joi.ObjectSchema}
 */
const allocationReviewSchema = Joi.object({
  warehouseIds: validateUUIDArray('Warehouse IDs', { required: true }),
  allocationIds: validateUUIDArray('Allocation IDs', { required: true }),
});

/**
 * Joi validation schema for querying paginated inventory allocations.
 *
 * This schema validates query parameters used in listing/filtering inventory allocation
 * records via the API or UI dashboard. It supports pagination, sorting, and filtering
 * based on allocation metadata, order metadata, sales order metadata, and keyword search.
 *
 * ### Composition:
 * - Inherits from:
 *   - `paginationSchema` → `page`, `limit`
 *   - `createSortSchema('created_at')` → `sortBy`, `sortOrder` (default: `'created_at'`)
 *   - `aggregatedDateRangeSchema` → allocation-related date filters:
 *     - `aggregatedAllocatedAfter`
 *     - `aggregatedAllocatedBefore`
 *     - `aggregatedCreatedAfter`
 *     - `aggregatedCreatedBefore`
 *
 * ### Supported Filters:
 * - **Allocation-level**
 *   - `statusIds` → Array of allocation status UUIDs (`ia.status_id = ANY(...)`)
 *   - `warehouseIds` → Array of warehouse UUIDs (`ia.warehouse_id = ANY(...)`)
 *   - `batchIds` → Array of batch UUIDs (`ia.batch_id = ANY(...)`)
 *   - `allocationCreatedBy` → UUID of user who created the allocation
 *
 * - **Aggregated allocation date filters (from `aggregatedDateRangeSchema`)**
 *   - `aggregatedAllocatedAfter` → Filter allocations with `allocated_at >=` this ISO date
 *   - `aggregatedAllocatedBefore` → Filter allocations with `allocated_at <=` this ISO date
 *   - `aggregatedCreatedAfter` → Filter allocations with `created_at >=` this ISO date
 *   - `aggregatedCreatedBefore` → Filter allocations with `created_at <=` this ISO date
 *
 * - **Order-level**
 *   - `orderNumber` → Partial match on order number (ILIKE `%value%`)
 *   - `orderStatusId` → Order status UUID
 *   - `orderTypeId` → Order type UUID
 *   - `orderCreatedBy` → UUID of user who created the order
 *
 * - **Sales order-level**
 *   - `paymentStatusId` → Payment status UUID
 *
 * - **Keyword search**
 *   - `keyword` → Fuzzy match against order number, SKU, product name, or customer name
 *
 * ### Notes:
 * - UUID arrays (e.g. `statusIds`, `warehouseIds`) must be valid if provided. Empty arrays are allowed.
 * - Singular UUID fields (e.g. `allocationCreatedBy`, `orderStatusId`) must be valid if provided.
 * - All string fields are trimmed and optional.
 * - Pagination defaults: `page = 1`, `limit = 10`
 * - Sort defaults: `sortBy = 'created_at'`, `sortOrder = 'DESC'`
 *
 * @type {import('joi').ObjectSchema}
 */
const inventoryAllocationsQuerySchema = paginationSchema
  .concat(createSortSchema('created_at')) // default sort
  .concat(aggregatedDateRangeSchema)
  .keys({
    // --- Allocation-level filters ---
    statusIds: validateUUIDOrUUIDArrayOptional('Allocation status IDs'),
    warehouseIds: validateUUIDOrUUIDArrayOptional('Warehouse IDs'),
    batchIds: validateUUIDOrUUIDArrayOptional('Batch IDs'),
    allocationCreatedBy: validateOptionalUUID('Allocation Created By User ID'),

    // --- Order-level filters ---
    orderNumber: validateOptionalString('Order Number'),
    orderStatusId: validateOptionalUUID('Order Status ID'),
    orderTypeId: validateOptionalUUID('Order Type ID'),
    orderCreatedBy: validateOptionalUUID('Order Created By User ID'),

    // --- Sales order-level filters ---
    paymentStatusId: validateOptionalUUID('Payment Status ID'),

    // --- Keyword search ---
    keyword: validateOptionalString(
      'Keyword for fuzzy matching (order number, SKU, product name, or customer)'
    ),
  });

module.exports = {
  allocateInventorySchema,
  allocationReviewSchema,
  inventoryAllocationsQuerySchema,
};
