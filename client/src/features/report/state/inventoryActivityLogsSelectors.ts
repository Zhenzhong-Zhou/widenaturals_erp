import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Root selector to access the inventory activity logs slice.
 */
const selectInventoryActivityLogsState= createSelector(
  [selectRuntime],
  (runtime) => runtime.inventoryActivityLogs
);

//
// Base (non-paginated) log selectors
//

/**
 * Selects the list of base (non-paginated) inventory activity logs.
 */
export const selectBaseInventoryLogs = createSelector(
  selectInventoryActivityLogsState,
  (state) => state.base.data
);

/**
 * Indicates whether base logs are currently loading.
 */
export const selectBaseLogsLoading = createSelector(
  selectInventoryActivityLogsState,
  (state) => state.base.loading
);

/**
 * Selects the error message for base log fetch, if any.
 */
export const selectBaseLogsError = createSelector(
  selectInventoryActivityLogsState,
  (state) => state.base.error
);

//
// Paginated log selectors
//

/**
 * Selects the list of paginated inventory activity logs.
 */
export const selectPaginatedInventoryLogs = createSelector(
  selectInventoryActivityLogsState,
  (state) => state.paginated.data
);

/**
 * Selects the current pagination metadata for paginated logs.
 */
export const selectPaginatedLogsPagination = createSelector(
  selectInventoryActivityLogsState,
  (state) => state.paginated.pagination
);

/**
 * Indicates whether paginated logs are currently loading.
 */
export const selectPaginatedLogsLoading = createSelector(
  selectInventoryActivityLogsState,
  (state) => state.paginated.loading
);

/**
 * Selects the error message for paginated log fetch, if any.
 */
export const selectPaginatedLogsError = createSelector(
  selectInventoryActivityLogsState,
  (state) => state.paginated.error
);
