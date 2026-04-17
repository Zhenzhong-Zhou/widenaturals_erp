/**
 * @file warehouse-types.js
 * @description JSDoc typedefs for the warehouse domain.
 *
 * Row types    — raw DB column aliases returned by repository queries.
 * Record types — transformed UI-facing shapes returned by the service layer.
 */

'use strict';

// ─── Row Types ────────────────────────────────────────────────────────────────

/**
 * Raw DB row returned by the paginated warehouse list query.
 * Inventory summary fields come from the LEFT JOIN LATERAL subquery.
 * COUNT/SUM aggregates arrive as strings over the wire — parsed in transformer.
 *
 * @typedef {object} WarehouseRow
 * @property {string}      id
 * @property {string}      warehouse_name
 * @property {string}      warehouse_code
 * @property {number|null} storage_capacity
 * @property {string|null} default_fee
 * @property {boolean}     is_archived
 * @property {string}      location_id
 * @property {string}      location_name
 * @property {string|null} warehouse_type_id
 * @property {string|null} warehouse_type_name
 * @property {string}      status_id
 * @property {string|null} status_name
 * @property {string|null} status_date
 * @property {string}      total_batches        - PostgreSQL aggregate — string over the wire.
 * @property {string}      total_quantity       - PostgreSQL aggregate — string over the wire.
 * @property {string}      total_reserved       - PostgreSQL aggregate — string over the wire.
 * @property {string}      available_quantity   - Derived: total_quantity - total_reserved.
 * @property {string|null} created_at
 * @property {string|null} created_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_at
 * @property {string|null} updated_by
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

/**
 * Raw DB row returned by GET_WAREHOUSE_BY_ID_QUERY.
 * Extends WarehouseRow with full location address and location type fields.
 *
 * @typedef {object} WarehouseDetailRow
 * @property {string}      id
 * @property {string}      warehouse_name
 * @property {string}      warehouse_code
 * @property {number|null} storage_capacity
 * @property {string|null} default_fee
 * @property {boolean}     is_archived
 * @property {string|null} notes
 * @property {string}      location_id
 * @property {string}      location_name
 * @property {string|null} address_line1
 * @property {string|null} address_line2
 * @property {string|null} city
 * @property {string|null} province_or_state
 * @property {string|null} postal_code
 * @property {string|null} country
 * @property {string|null} location_type_id
 * @property {string|null} location_type_name
 * @property {string|null} warehouse_type_id
 * @property {string|null} warehouse_type_name
 * @property {string}      status_id
 * @property {string|null} status_name
 * @property {string|null} status_date
 * @property {string}      total_batches        - PostgreSQL aggregate — string over the wire.
 * @property {string}      total_quantity       - PostgreSQL aggregate — string over the wire.
 * @property {string}      total_reserved       - PostgreSQL aggregate — string over the wire.
 * @property {string}      available_quantity   - Derived: total_quantity - total_reserved.
 * @property {string|null} created_at
 * @property {string|null} created_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_at
 * @property {string|null} updated_by
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

// ─── Record Types ─────────────────────────────────────────────────────────────

/**
 * Transformed warehouse record for the paginated list view.
 *
 * @typedef {object} WarehouseRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {number|null} storageCapacity
 * @property {number|null} defaultFee
 * @property {boolean}     isArchived
 * @property {object}      location
 * @property {string}      location.id
 * @property {string}      location.name
 * @property {object|null} warehouseType
 * @property {string}      warehouseType.id
 * @property {string}      warehouseType.name
 * @property {object}      status
 * @property {string}      status.id
 * @property {string|null} status.name
 * @property {string|null} status.date
 * @property {object}      summary
 * @property {number}      summary.totalBatches
 * @property {number}      summary.totalQuantity
 * @property {number}      summary.totalReserved
 * @property {number}      summary.availableQuantity
 * @property {object}      audit
 */

/**
 * Transformed warehouse record for the detail view.
 * Extends WarehouseRecord with full location address, location type, and notes.
 *
 * @typedef {object} WarehouseDetailRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string}      code
 * @property {number|null} storageCapacity
 * @property {number|null} defaultFee
 * @property {boolean}     isArchived
 * @property {string|null} notes
 * @property {object}      location
 * @property {string}      location.id
 * @property {string}      location.name
 * @property {string|null} location.addressLine1
 * @property {string|null} location.addressLine2
 * @property {string|null} location.city
 * @property {string|null} location.provinceOrState
 * @property {string|null} location.postalCode
 * @property {string|null} location.country
 * @property {object|null} location.locationType
 * @property {string}      location.locationType.id
 * @property {string}      location.locationType.name
 * @property {object|null} warehouseType
 * @property {string}      warehouseType.id
 * @property {string}      warehouseType.name
 * @property {object}      status
 * @property {string}      status.id
 * @property {string|null} status.name
 * @property {string|null} status.date
 * @property {object}      summary
 * @property {number}      summary.totalBatches
 * @property {number}      summary.totalQuantity
 * @property {number}      summary.totalReserved
 * @property {number}      summary.availableQuantity
 * @property {object}      audit
 */
