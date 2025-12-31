import { RequestPolicyOptions } from '@utils/http';

/**
 * Canonical request policy definitions.
 *
 * Each policy expresses *semantic intent* rather than low-level
 * transport mechanics. Retry count, delay, and timeout are
 * derived from the selected policy and must NOT be overridden
 * casually at call sites.
 *
 * Usage:
 * - AUTH      → authentication / session-sensitive operations
 * - READ      → safe, idempotent data fetching
 * - WRITE     → state-changing operations
 * - CRITICAL  → boot-time or system-critical requests
 *
 * IMPORTANT:
 * - Policies define behavior, not guarantees.
 * - Do NOT tune individual values without understanding
 *   system-wide implications.
 */
export const REQUEST_POLICIES = {
  /**
   * Authentication-sensitive requests.
   *
   * - No retries to avoid duplicate auth side effects
   * - Short timeout to fail fast and force re-auth
   *
   * NOTE:
   * - Used for login, refresh, password reset
   * - NOT for general system bootstrap
   */
  AUTH: {
    retries: 0,
    timeoutMs: 5000,
  },
  
  /**
   * Safe, idempotent read operations.
   *
   * - Retries enabled for transient network issues
   * - Short timeout to keep UI responsive
   */
  READ: {
    retries: 3,
    delayMs: 500,
    timeoutMs: 3000,
  },
  
  /**
   * State-changing write operations.
   *
   * - Minimal retry allowance for flaky networks
   * - Longer timeout to accommodate server-side validation
   */
  WRITE: {
    retries: 1,
    delayMs: 1000,
    timeoutMs: 5000,
  },
  
  /**
   * System-critical or bootstrap requests.
   *
   * - No retries (failure should surface immediately)
   * - Extended timeout for cold starts or infra delays
   */
  CRITICAL: {
    retries: 0,
    timeoutMs: 8000,
  },
} as const satisfies Record<string, RequestPolicyOptions>;
