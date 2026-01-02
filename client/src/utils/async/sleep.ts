/**
 * Promise-based sleep helper.
 *
 * Used for:
 * - Artificial delays (splash screens)
 * - Backoff strategies
 * - Controlled async sequencing
 *
 * @param ms - Duration in milliseconds
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
