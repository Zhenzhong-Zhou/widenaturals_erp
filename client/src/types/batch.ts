/**
 * Represents the domain-level batch entity type.
 *
 * Used to distinguish between different kinds of batches managed by the system,
 * such as finished product batches and packaging material batches.
 *
 * This type is a core domain discriminator and is shared across:
 * - Batch registry and batch creation flows
 * - Inventory intake and expiry tracking
 * - Compliance and audit records
 *
 * IMPORTANT:
 * - This type is intentionally strict (no `undefined`)
 * - Optional behavior should be handled at the feature or UI state level
 */
export type BatchEntityType = 'product' | 'packaging_material';

/**
 * UI-side widening of {@link BatchEntityType} that adds a sentinel `'all'`
 * value for "no filter applied".
 *
 * Used by batch-picker controls and lookup query state where the user can
 * choose to scope results to a specific entity type or view every type at
 * once. Distinct from `BatchEntityType` — which represents an actual batch
 * record's type and is never `'all'` — so the two should not be used
 * interchangeably:
 *
 * - A row in the database has a `BatchEntityType`.
 * - A filter control's selected value has a `BatchTypeFilter`.
 *
 * The `'all'` value is a UI concept only. It is dropped at the
 * service-layer boundary: when building a lookup query, callers omit
 * `batchType` from the request entirely rather than sending `'all'`,
 * matching the backend's contract that a missing filter means no filter.
 */
export type BatchTypeFilter = BatchEntityType | 'all';

/**
 * Severity classification for a batch's proximity to its expiry date.
 *
 * Derived from `daysUntilExpiry` against a configurable `nearExpiryDays`
 * threshold (see `getBatchExpiryMeta`):
 *
 * - `expired`  — already past the expiry date (`daysUntilExpiry < 0`)
 * - `critical` — within 30 days of expiry (`0 <= daysUntilExpiry <= 30`)
 * - `warning`  — within the near-expiry window but not critical
 *                (`30 < daysUntilExpiry <= nearExpiryDays`)
 * - `normal`   — beyond the near-expiry window (`daysUntilExpiry > nearExpiryDays`)
 *
 * Used to drive UI affordances such as chip color, sort priority, and
 * filter presets in batch and inventory views.
 */
export type ExpirySeverity = 'expired' | 'critical' | 'warning' | 'normal';
