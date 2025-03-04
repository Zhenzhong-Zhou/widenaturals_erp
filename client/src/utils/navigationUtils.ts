import { NavigateFunction } from "react-router-dom";

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
  inventoryId?: string | null,
) => {
  const path = warehouseId && inventoryId
    ? `/${basePath}/lot_adjustments/${warehouseId}/${inventoryId}`
    : warehouseId
      ? `/${basePath}/lot_adjustments/${warehouseId}`
      : inventoryId
        ? `/${basePath}/lot_adjustments/inventory/${inventoryId}`
        : `/${basePath}`;
  
  navigate(path);
};
