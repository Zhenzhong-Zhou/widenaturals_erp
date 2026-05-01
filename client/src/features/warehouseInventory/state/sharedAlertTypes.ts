/**
 * Aggregated alert counts for a single warehouse, computed server-side
 * across all batches in the warehouse (not limited to the current page).
 *
 * Drives the alert summary cards on the warehouse inventory page.
 * A count of zero means no batches currently match the condition.
 */
export type WarehouseSummaryAlerts = {
  /**
   * Number of batches whose available quantity is at or below the
   * low-stock threshold (currently 10 units).
   */
  lowStock: number;

  /**
   * Number of batches expiring within the next 30 days.
   * Excludes batches already expired.
   */
  expiringSoon: number;

  /**
   * Number of batches whose expiry date has already passed.
   */
  expired: number;
};
