const Joi = require('joi');
const {
  validateUUIDOrUUIDArrayOptional,
  validateOptionalUUID,
  paginationSchema,
  createSortSchema,
} = require('./general-validators');

/**
 * Joi validation schema for inventory activity log query parameters.
 *
 * Supports pagination, sorting, and multiple filters for fine-grained querying.
 *
 * Fields:
 * - Pagination:
 *   - `page`: Page number (integer ≥ 1). Default: 1
 *   - `limit`: Items per page (1–100). Default: 25
 *
 * - Sorting:
 *   - `sortBy`: Field to sort by (e.g., "created_at"). Default: 'created_at'
 *   - `sortOrder`: Sort direction, must be 'ASC' or 'DESC'. Default: 'DESC'
 *
 * - Filter Arrays (except comma-separated string or UUID array):
 *   - `warehouseIds`: UUIDs of warehouses
 *   - `locationIds`: UUIDs of locations
 *   - `productIds`: UUIDs of products
 *   - `skuIds`: UUIDs of SKUs
 *   - `batchIds`: UUIDs of batches
 *   - `packagingMaterialIds`: UUIDs of packaging materials
 *   - `actionTypeIds`: UUIDs of inventory action types
 *
 * - Scalar Filters:
 *   - `orderId`: Optional UUID of related order
 *   - `statusId`: Optional UUID for log status
 *   - `adjustmentTypeId`: Optional UUID for adjustment type
 *   - `performedBy`: Optional UUID of user who performed the action
 *   - `sourceType`: Optional string representing the source system/module
 *   - `batchType`: Optional enum: 'product' or 'packaging_material'
 *   - `fromDate`: ISO string, start date filter (inclusive)
 *   - `toDate`: ISO string, end date filter (inclusive)
 *
 * All fields are optional and support null/empty where applicable.
 */
const inventoryActivityLogQuerySchema = Joi.object({})
  .concat(paginationSchema)
  .concat(createSortSchema('created_at'))
  .keys({
    warehouseIds: validateUUIDOrUUIDArrayOptional('Warehouse IDs'),
    locationIds: validateUUIDOrUUIDArrayOptional('Location IDs'),
    productIds: validateUUIDOrUUIDArrayOptional('Product IDs'),
    skuIds: validateUUIDOrUUIDArrayOptional('SKU IDs'),
    batchIds: validateUUIDOrUUIDArrayOptional('Batch IDs'),
    packagingMaterialIds: validateUUIDOrUUIDArrayOptional('Packaging Material IDs'),
    actionTypeIds: validateUUIDOrUUIDArrayOptional('Action Type IDs'),

    orderId: validateOptionalUUID('Order ID'),
    statusId: validateOptionalUUID('Status ID'),
    adjustmentTypeId: validateOptionalUUID('Adjustment Type ID'),
    performedBy: validateOptionalUUID('Performed By'),

    sourceType: Joi.string().max(50).allow('', null),
    batchType: Joi.string()
      .valid('product', 'packaging_material')
      .allow('', null),

    fromDate: Joi.date().iso().allow('', null),
    toDate: Joi.date().iso().allow('', null),
  });

module.exports = {
  inventoryActivityLogQuerySchema,
};
