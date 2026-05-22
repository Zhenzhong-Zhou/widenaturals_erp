/**
 * Type definitions for the `tracking_numbers` domain.
 *
 * Two row shapes coexist here:
 * - Snake_case shapes (TrackingNumberRow, TrackingNumberInsertRow,
 *   TrackingNumberDuplicateRow) mirror DB columns and flow between repo
 *   and service.
 * - CamelCase shapes (TrackingNumberInputRecord, TrackingNumberConflict,
 *   CreateTrackingNumbersResult) sit on the service/controller boundary
 *   and match request/response payloads after Joi validation.
 *
 * status_id / status_date / created_at / updated_at are owned by DB defaults
 * and triggers, so they appear on the read row but not on the insert row.
 */

/**
 * Raw row stored in the tracking_numbers table.
 * Reflects the schema 1:1 — snake_case, nullable fields explicit.
 *
 * @typedef {Object} TrackingNumberRow
 * @property {string} id
 * @property {string} outbound_shipment_id
 * @property {string|null} tracking_number
 * @property {string} carrier
 * @property {string|null} service_name
 * @property {string|null} bol_number
 * @property {('LTL'|'FTL'|'Parcel')|null} freight_type
 * @property {string|null} custom_notes
 * @property {string|null} shipped_date            - ISO date string.
 * @property {string} status_id
 * @property {string} status_date                  - ISO timestamp.
 * @property {string} created_at                   - ISO timestamp.
 * @property {string|null} updated_at              - ISO timestamp; null until first update.
 * @property {string|null} created_by
 * @property {string|null} updated_by
 */

/**
 * Row hydrated with joined status fields. Produced by tracking-number read
 * queries that JOIN the status lookup table (see the *_WITH_STATUS query
 * variants in tracking-number-queries when added).
 *
 * @typedef {TrackingNumberRow & { status_name: string, status_code: string }} TrackingNumberWithStatusRow
 */

/**
 * Row shape returned by CHECK_TRACKING_NUMBERS_EXIST_BULK.
 * Slim — only what's needed to surface a 409 conflict response.
 *
 * @typedef {Object} TrackingNumberDuplicateRow
 * @property {string} id
 * @property {string} carrier
 * @property {string} tracking_number
 * @property {string} outbound_shipment_id
 */

/**
 * Service-layer input record. camelCase — matches request payload
 * after Joi validation.
 *
 * @typedef {Object} TrackingNumberInputRecord
 * @property {string} carrier                                - Required.
 * @property {string} [trackingNumber]                       - Format ^[A-Z0-9\-]{8,30}$ when present.
 * @property {string} [serviceName]
 * @property {string} [bolNumber]
 * @property {('LTL'|'FTL'|'Parcel')} [freightType]
 * @property {string} [customNotes]
 * @property {string} [shippedDate]                          - ISO date.
 */

/**
 * Snake_case row built by the service and passed to insertTrackingNumbersBulk.
 * Mirrors TRACKING_NUMBER_INSERT_COLUMNS (less the trigger-owned fields).
 *
 * @typedef {Object} TrackingNumberInsertRow
 * @property {string} outbound_shipment_id
 * @property {string|null} tracking_number
 * @property {string} carrier
 * @property {string|null} service_name
 * @property {string|null} bol_number
 * @property {('LTL'|'FTL'|'Parcel')|null} freight_type
 * @property {string|null} custom_notes
 * @property {string|null} shipped_date
 * @property {string} created_by
 */

/**
 * Minimal row returned after inserting tracking_numbers.
 *
 * @typedef {Object} TrackingNumberInsertResultRow
 * @property {string} id
 */

/**
 * Conflict detail surfaced in the AppError meta when a duplicate
 * (carrier, tracking_number) is detected pre-insert.
 *
 * @typedef {Object} TrackingNumberConflict
 * @property {string} id                          - Existing tracking_numbers.id.
 * @property {string} carrier
 * @property {string} trackingNumber
 * @property {string} existingShipmentId
 */

/**
 * Lean response shape returned by createTrackingNumbersService.
 *
 * @typedef {Object} CreateTrackingNumbersResult
 * @property {number} count
 * @property {string[]} ids
 */
