/**
 * All supported transport policy keys.
 *
 * These represent semantic intent, not behavior.
 * Concrete retry/timeout behavior is defined separately.
 */
export type RequestPolicyKey =
  | 'READ'
  | 'WRITE'
  | 'AUTH'
  | 'CRITICAL';

/**
 * Policies allowed for idempotent read requests.
 *
 * WRITE is intentionally excluded.
 */
export type ReadPolicy = 'READ' | 'CRITICAL';

/**
 * Policies allowed for non-idempotent write requests.
 *
 * READ is intentionally excluded to prevent unsafe retries.
 */
export type WritePolicy = 'WRITE' | 'CRITICAL' | 'AUTH';
