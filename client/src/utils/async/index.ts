/* =========================================================
 * Async utilities
 *
 * Centralized helpers for managing asynchronous control flow:
 * - Retry orchestration
 * - Timeout enforcement
 * - Execution delays
 *
 * These utilities are framework-agnostic and side-effect free.
 * ======================================================= */

/* ---------------------------------------------------------
 * Retry helpers
 * ------------------------------------------------------ */

/**
 * Executes an async operation with retry semantics.
 */
export { withRetry } from './withRetry';

/**
 * Default predicate used to determine whether an error
 * is eligible for retry (e.g. network / server errors).
 */
export { defaultRetryPredicate } from './retryPredicates';

/* ---------------------------------------------------------
 * Timeout helpers
 * ------------------------------------------------------ */

/**
 * Enforces a hard execution timeout on an async operation.
 */
export { withTimeout } from './withTimeout';

/* ---------------------------------------------------------
 * Timing helpers
 * ------------------------------------------------------ */

/**
 * Promise-based delay helper.
 * Useful for orchestration, backoff, and testing.
 */
export { sleep } from './sleep';
