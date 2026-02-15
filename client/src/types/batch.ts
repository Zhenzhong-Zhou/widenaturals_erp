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
