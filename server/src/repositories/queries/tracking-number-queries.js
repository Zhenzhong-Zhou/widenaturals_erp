/**
 * Raw SQL query string constants for the `tracking_numbers` domain.
 *
 * Covers writes (bulk insert column order, conflict targets, per-row patch)
 * and reads (per-shipment list, batch lookup by IDs, bulk duplicate pre-flight)
 * used by the outbound shipment / tracking-number workflow.
 *
 * Conventions:
 * - Parameterized placeholders ($1, $2, ...) only — no string interpolation.
 * - No JSDoc on query string constants.
 * - Inserts go through the shared `bulkInsert` utility — see `TRACKING_NUMBER_INSERT_COLUMNS`.
 * - Partial updates use the `COALESCE($n, column)` pattern: passing NULL preserves
 *   the existing value, so callers cannot null-out a field through this query.
 *   If clearing a column is ever needed, add a dedicated query rather than
 *   reworking the COALESCE shape.
 */

// ---------------------------------------------------------------------------
// Insert / conflict metadata
// ---------------------------------------------------------------------------

// Column order for bulkInsert. Repo builds row arrays matching this order.
// `id`, `status_date`, and `created_at` default in the DB.
// `updated_at` / `updated_by` are written explicitly on insert because the
// update trigger does not fire on INSERT, and we want the audit trail
// populated from row birth.
const TRACKING_NUMBER_INSERT_COLUMNS = [
  'outbound_shipment_id',
  'tracking_number',
  'carrier',
  'service_name',
  'bol_number',
  'freight_type',
  'custom_notes',
  'shipped_date',
  'created_by',
  'updated_at',
  'updated_by',
];

// Matches the (carrier, tracking_number) unique constraint.
// NULL tracking_number rows never collide (Postgres NULL-distinct semantics) — correct behavior.
const TRACKING_NUMBER_CONFLICT_COLUMNS = ['carrier', 'tracking_number'];

// ---------------------------------------------------------------------------
// Existence / pre-flight checks
// ---------------------------------------------------------------------------

// Cheapest existence probe — caller checks rowCount > 0.
const CHECK_SHIPMENT_HAS_TRACKING = `
  SELECT 1
  FROM tracking_numbers
  WHERE outbound_shipment_id = $1
  LIMIT 1;
`;

// Bulk pre-flight: pass parallel arrays of carriers + tracking_numbers.
// ROWS FROM(UNNEST(...), UNNEST(...)) zips the two arrays positionally into
// an `input(carrier, tracking_number)` virtual table, then INNER JOINs against
// the live table so we get back exactly the rows that already exist.
// Lets the service surface a precise "these N are duplicates" error before
// hitting the unique constraint.
const CHECK_TRACKING_NUMBERS_EXIST_BULK = `
  SELECT tn.id, tn.carrier, tn.tracking_number, tn.outbound_shipment_id
  FROM tracking_numbers tn
  INNER JOIN ROWS FROM (
    UNNEST($1::text[]),
    UNNEST($2::text[])
  ) AS input(carrier, tracking_number)
    ON tn.carrier = input.carrier
   AND tn.tracking_number = input.tracking_number;
`;

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const GET_TRACKING_NUMBERS_BY_SHIPMENT_ID = `
  SELECT
    tn.id,
    tn.outbound_shipment_id,
    tn.tracking_number,
    tn.carrier,
    tn.service_name,
    tn.bol_number,
    tn.freight_type,
    tn.custom_notes,
    tn.shipped_date,
    tn.created_at,
    tn.updated_at,
    tn.created_by,
    tn.updated_by
  FROM tracking_numbers tn
  WHERE tn.outbound_shipment_id = $1
  ORDER BY tn.created_at ASC;
`;

// Batch fetch by id — used after bulk insert / update to hydrate full rows.
const GET_TRACKING_NUMBERS_BY_IDS = `
  SELECT
    tn.id,
    tn.outbound_shipment_id,
    tn.tracking_number,
    tn.carrier,
    tn.service_name,
    tn.bol_number,
    tn.freight_type,
    tn.custom_notes,
    tn.shipped_date,
    tn.created_at,
    tn.updated_at,
    tn.created_by,
    tn.updated_by
  FROM tracking_numbers tn
  WHERE tn.id = ANY($1::uuid[])
  ORDER BY tn.created_at ASC;
`;

// ---------------------------------------------------------------------------
// Writes (update)
// ---------------------------------------------------------------------------

// Partial update. NULL params preserve existing values via COALESCE.
// Param order: $1 id, $2..$8 patchable columns (see SET clause), $9 updated_by.
const UPDATE_TRACKING_NUMBER_BY_ID = `
  UPDATE tracking_numbers
  SET
    tracking_number = COALESCE($2, tracking_number),
    carrier         = COALESCE($3, carrier),
    service_name    = COALESCE($4, service_name),
    bol_number      = COALESCE($5, bol_number),
    freight_type    = COALESCE($6, freight_type),
    custom_notes    = COALESCE($7, custom_notes),
    shipped_date    = COALESCE($8, shipped_date),
    updated_at      = NOW(),
    updated_by      = $9
  WHERE id = $1
  RETURNING *;
`;

module.exports = {
  TRACKING_NUMBER_INSERT_COLUMNS,
  TRACKING_NUMBER_CONFLICT_COLUMNS,
  CHECK_SHIPMENT_HAS_TRACKING,
  CHECK_TRACKING_NUMBERS_EXIST_BULK,
  GET_TRACKING_NUMBERS_BY_SHIPMENT_ID,
  GET_TRACKING_NUMBERS_BY_IDS,
  UPDATE_TRACKING_NUMBER_BY_ID,
};
