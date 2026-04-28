/**
 * @module utils/inventoryStatus
 *
 * Inventory status helpers for low stock and expiry alerting.
 *
 * Exposes the threshold constants and predicate functions used across
 * the warehouse inventory feature to flag batches that need attention.
 * Helpers are pure and free of React or pg dependencies so they can be
 * imported anywhere from chip components to selectors.
 */

import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';

/**
 * Quantity threshold (in units) for the low stock alert.
 * Available quantities at or below this value trigger the low stock chip
 * and contribute to the warehouse-wide low stock count.
 */
export const LOW_STOCK_THRESHOLD = 10;

/**
 * Window (in days) for the expiring soon alert.
 * Batches whose expiry date falls within this many days from now are
 * considered expiring soon. Already-expired batches do not count toward
 * this window — they are handled separately by isExpired.
 */
export const EXPIRING_SOON_DAYS = 30;

/**
 * Returns true when the given available quantity is at or below the
 * low stock threshold.
 *
 * Use when only the quantity is available (e.g. summary rollups,
 * aggregate fields). For full inventory records, prefer isLowStock.
 */
export const isLowStockQuantity = (available: number): boolean =>
  available <= LOW_STOCK_THRESHOLD;

/**
 * Returns true when the given inventory record's available quantity is
 * at or below the low stock threshold.
 *
 * Convenience wrapper around isLowStockQuantity for full flattened
 * inventory rows.
 */
export const isLowStock = (record: FlattenedWarehouseInventory): boolean =>
  isLowStockQuantity(record.availableQuantity);

/**
 * Returns true when the given expiry date falls within the expiring soon
 * window — that is, between today and EXPIRING_SOON_DAYS days from now.
 *
 * Returns false for null, undefined, or already-expired dates. Already
 * expired batches are intentionally excluded so the expiring soon and
 * expired states stay mutually exclusive.
 */
export const isExpiringSoon = (
  expiryDate: string | null | undefined
): boolean => {
  if (!expiryDate) return false;
  const daysUntil =
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntil <= EXPIRING_SOON_DAYS && daysUntil >= 0;
};

/**
 * Returns true when the given expiry date is in the past relative to now.
 *
 * Returns false for null or undefined dates. Used by the expired chip
 * and the warehouse-wide expired count.
 */
export const isExpired = (
  expiryDate: string | null | undefined
): boolean => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};
