import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the system health slice.
 *
 * Internal-only selector used to read the systemHealth slice
 * from the Redux runtime tree.
 *
 * NOTE:
 * - This selector MUST NOT be exported
 * - All public selectors compose of this
 */
const selectSystemHealthState = (state: RootState) =>
  selectRuntime(state).systemHealth;

/* =========================================================
 * Raw state selectors
 * ======================================================= */

/**
 * Selects the full health API response (maybe null).
 */
export const selectSystemHealthData = createSelector(
  [selectSystemHealthState],
  (health) => health.data
);

/**
 * Selects the loading flag for system health.
 */
export const selectSystemHealthLoading = createSelector(
  [selectSystemHealthState],
  (health) => health.loading
);

/**
 * Selects any error associated with the system health check.
 */
export const selectSystemHealthError = createSelector(
  [selectSystemHealthState],
  (health) => health.error
);

/* =========================================================
 * Derived selectors (API-aware)
 * ======================================================= */

/**
 * Returns true if no system health snapshot has been loaded yet.
 */
export const selectIsSystemHealthEmpty = createSelector(
  [selectSystemHealthData],
  (data) => data === null
);

/**
 * Selects the overall server health status.
 */
export const selectServerStatus = createSelector(
  [selectSystemHealthData],
  (data) => data?.server
);

/**
 * Selects the database service health status.
 */
export const selectDatabaseStatus = createSelector(
  [selectSystemHealthData],
  (data) => data?.services.database.status
);

/**
 * Selects the connection pool service health status.
 */
export const selectPoolStatus = createSelector(
  [selectSystemHealthData],
  (data) => data?.services.pool.status
);

/**
 * Selects the timestamp of the last health snapshot.
 */
export const selectHealthTimestamp = createSelector(
  [selectSystemHealthData],
  (data) => data?.timestamp
);

/* =========================================================
 * Convenience boolean selectors
 * ======================================================= */

/**
 * Returns true if the server is reported as healthy.
 */
export const selectIsServerHealthy = createSelector(
  [selectServerStatus],
  (status) => status === 'healthy'
);

/**
 * Returns true if the system health is currently being loaded.
 */
export const selectIsSystemHealthLoading = createSelector(
  [selectSystemHealthLoading],
  (loading) => loading
);

/**
 * Returns true if system health data is unavailable or unhealthy.
 *
 * Useful for bootstrap gating.
 */
export const selectIsSystemHealthUnavailable = createSelector(
  [selectSystemHealthData, selectSystemHealthError],
  (data, error) => !data || !!error
);
