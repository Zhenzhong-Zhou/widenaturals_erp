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
