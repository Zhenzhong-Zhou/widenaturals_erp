import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the warehouse inventory outbound state slice.
 */
const selectWarehouseInventoryOutboundState = (state: RootState) =>
  selectRuntime(state).warehouseInventoryOutbound;

/**
 * Selects whether the outbound recording request is currently loading.
 */
export const selectWarehouseInventoryOutboundLoading = createSelector(
  [selectWarehouseInventoryOutboundState],
  (outboundState) => outboundState.loading
);

/**
 * Selects any error message from the outbound recording request.
 */
export const selectWarehouseInventoryOutboundError = createSelector(
  [selectWarehouseInventoryOutboundState],
  (outboundState): string | null => outboundState.error?.message ?? null
);

/**
 * Selects whether the outbound recording completed successfully.
 */
export const selectWarehouseInventoryOutboundSuccess = createSelector(
  [selectWarehouseInventoryOutboundState],
  (outboundState) => !!outboundState.data
);

/**
 * Selects the normalized outbound recording response.
 */
export const selectWarehouseInventoryOutboundResponse = createSelector(
  [selectWarehouseInventoryOutboundState],
  (outboundState) => ({
    message: outboundState.message ?? '',
    data: outboundState.data ?? [],
  })
);
