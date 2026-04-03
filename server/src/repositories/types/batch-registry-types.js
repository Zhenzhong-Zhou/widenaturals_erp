/**
 * @file batch-registry-types.js
 * @description JSDoc typedefs for batch registry domain.
 *
 * Two categories of types:
 *   - Row types    (`BatchRegistryRow`)    – raw DB column aliases from the query
 *   - Record types (`BatchRegistryRecord`) – transformed UI-facing shapes
 *
 * Row types reflect the exact column aliases returned by the paginated
 * batch registry query. Nullable fields are those sourced from LEFT JOINed
 * tables — only one batch type's columns will be populated per row.
 */

'use strict';

/**
 * Raw DB row returned by the paginated batch registry query.
 *
 * Each row represents a single batch registry entry. Because product and
 * packaging material batches are stored separately, only one set of
 * type-specific columns will be non-null per row — determined by `batch_type`.
 *
 * @typedef {Object} BatchRegistryRow
 *
 * — Core registry fields —
 * @property {string}      batch_registry_id            - `br.id`
 * @property {string}      batch_type                   - `'product'` | `'packaging_material'`
 * @property {string}      registered_at                - `br.registered_at`
 * @property {string}      registered_by                - `br.registered_by` (user UUID)
 * @property {string|null} registered_by_firstname      - `u_reg.firstname`
 * @property {string|null} registered_by_lastname       - `u_reg.lastname`
 * @property {string|null} note                         - `br.note`
 *
 * — Product batch fields (null when batch_type = 'packaging_material') —
 * @property {string|null} product_batch_id             - `pb.id`
 * @property {string|null} product_lot_number           - `pb.lot_number`
 * @property {string|null} product_expiry_date          - `pb.expiry_date`
 * @property {string|null} product_batch_status_id      - `pb.status_id`
 * @property {string|null} product_batch_status_name    - `bs_pb.name`
 * @property {string|null} product_batch_status_date    - `pb.status_date`
 * @property {string|null} sku_id                       - `s.id`
 * @property {string|null} sku_code                     - `s.sku`
 * @property {string|null} product_id                   - `p.id`
 * @property {string|null} product_name                 - `p.name`
 * @property {string|null} manufacturer_id              - `m.id`
 * @property {string|null} manufacturer_name            - `m.name`
 *
 * — Packaging material batch fields (null when batch_type = 'product') —
 * @property {string|null} packaging_batch_id           - `pmb.id`
 * @property {string|null} packaging_lot_number         - `pmb.lot_number`
 * @property {string|null} packaging_display_name       - `pmb.received_label_name`
 * @property {string|null} packaging_expiry_date        - `pmb.expiry_date`
 * @property {string|null} packaging_batch_status_id    - `pmb.status_id`
 * @property {string|null} packaging_batch_status_name  - `bs_pmb.name`
 * @property {string|null} packaging_batch_status_date  - `pmb.status_date`
 * @property {string|null} packaging_material_id        - `pm.id`
 * @property {string|null} packaging_material_code      - `pm.code`
 * @property {string|null} supplier_id                  - `sup.id`
 * @property {string|null} supplier_name                - `sup.name`
 */

/**
 * Transformed product batch registry record (UI-facing shape).
 *
 * @typedef {Object} ProductBatchRegistryRecord
 * @property {string}      id
 * @property {string}      type                 - Always `'product'`
 * @property {string|null} productBatchId
 * @property {string|null} lotNumber
 * @property {string|null} expiryDate
 * @property {{id: string|null, name: string|null}}                    product
 * @property {{id: string|null, code: string|null}}                    sku
 * @property {{id: string|null, name: string|null}}                    manufacturer
 * @property {{id: string|null, name: string|null, date: string|null}} status
 * @property {string}      registeredAt
 * @property {{id: string|null, name: string|null}}                    registeredBy
 * @property {string|null} note
 */

/**
 * Transformed packaging material batch registry record (UI-facing shape).
 *
 * @typedef {Object} PackagingBatchRegistryRecord
 * @property {string}      id
 * @property {string}      type                 - Always `'packaging_material'`
 * @property {string|null} packagingBatchId
 * @property {string|null} lotNumber
 * @property {string|null} packagingDisplayName
 * @property {string|null} expiryDate
 * @property {{id: string|null, code: string|null}}                    packagingMaterial
 * @property {{id: string|null, name: string|null}}                    supplier
 * @property {{id: string|null, name: string|null, date: string|null}} status
 * @property {string}      registeredAt
 * @property {{id: string|null, name: string|null}}                    registeredBy
 * @property {string|null} note
 */

/**
 * Union of all possible transformed batch registry record shapes.
 *
 * @typedef {ProductBatchRegistryRecord | PackagingBatchRegistryRecord} BatchRegistryRecord
 */
