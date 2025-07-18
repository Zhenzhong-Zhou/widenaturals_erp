import type { NavigateFunction } from 'react-router-dom';
import { getOrderTypeSlug } from '@utils/slugUtils.ts';
import type { Order } from '@features/order';

/**
 * Handles dynamic navigation for different reports based on warehouse, inventory, and lot parameters.
 * @param {NavigateFunction} navigate - React Router's navigate function.
 * @param {string} basePath - Base path for redirection (e.g., "reports/adjustments").
 * @param {string | null} warehouseId - Optional warehouse ID.
 * @param {string | null} inventoryId - Optional inventory ID.
 */
export const handleAdjustmentReportRedirect = (
  navigate: NavigateFunction,
  basePath: string,
  warehouseId?: string | null,
  inventoryId?: string | null
) => {
  const path =
    warehouseId && inventoryId
      ? `/${basePath}/lot_adjustments/${warehouseId}/${inventoryId}`
      : warehouseId
        ? `/${basePath}/lot_adjustments/${warehouseId}`
        : inventoryId
          ? `/${basePath}/lot_adjustments/inventory/${inventoryId}`
          : `/${basePath}`;

  navigate(path);
};

/**
 * Handles dynamic navigation for inventory activity logs based on warehouse, inventory, and lot parameters.
 * @param {NavigateFunction} navigate - React Router's navigate function.
 * @param {string} basePath - Base path for redirection (e.g., "reports/inventory-logs").
 * @param {string | null} warehouseId - Optional warehouse ID.
 * @param {string | null} inventoryId - Optional inventory ID.
 * @param {string | null} lotId - Optional lot ID.
 */
export const handleInventoryActivityLogRedirect = (
  navigate: NavigateFunction,
  basePath: string,
  warehouseId?: string | null,
  inventoryId?: string | null,
  lotId?: string | null
) => {
  const path =
    warehouseId && inventoryId && lotId
      ? `/${basePath}/logs/${warehouseId}/${inventoryId}/${lotId}`
      : warehouseId && inventoryId
        ? `/${basePath}/logs/${warehouseId}/${inventoryId}`
        : warehouseId
          ? `/${basePath}/logs/${warehouseId}`
          : inventoryId
            ? `/${basePath}/logs/inventory/${inventoryId}`
            : `/${basePath}`;

  navigate(path);
};

/**
 * Handles navigation to the inventory history page with optional filters.
 *
 * @param {NavigateFunction} navigate - React Router's navigate function.
 * @param {string} basePath - Base path for inventory logs.
 * @param {string | null} inventoryId - (Optional) Inventory ID for filtering.
 */
export const handleInventoryHistoryRedirect = (
  navigate: NavigateFunction,
  basePath: string,
  inventoryId?: string | null
) => {
  // Construct base path with inventoryId
  const path = inventoryId
    ? `/${basePath}/histories/${inventoryId}`
    : `/${basePath}/histories`;

  // Navigate to the generated path
  navigate(path);
};

/**
 * Generates the appropriate route path for an order based on its status and type.
 *
 * @param row - The order object containing status_code, order_type, and id
 * @returns A string route path directing to the correct page (edit, confirmed view, or default view)
 *
 * Examples:
 * - ORDER_PENDING or ORDER_EDITED → /orders/:type/:id/edit
 * - ORDER_CONFIRMED → /orders/:type/:id/allocate
 * - All other statuses → /orders/:type/:id
 */
export const getOrderRoutePath = (row: Order): string => {
  const orderTypeSlug = getOrderTypeSlug(row.order_type);

  switch (row.status_code) {
    case 'ORDER_PENDING':
    case 'ORDER_EDITED':
      return `/orders/${orderTypeSlug}/${row.id}/edit`;
    case 'ORDER_CONFIRMED':
    case 'ORDER_ALLOCATING':
    case 'ORDER_ALLOCATED':
    case 'ORDER_PARTIAL':
      return `/orders/${orderTypeSlug}/${row.id}/allocate`;
    default:
      return `/orders/${orderTypeSlug}/${row.id}`;
  }
};
