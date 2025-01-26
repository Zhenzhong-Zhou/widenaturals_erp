import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';
import { HealthState } from './healthStatusState.ts';

// Base selector to access the health slice
export const selectHealthState = (state: RootState): HealthState =>
  state.health;

// Selector to get the overall server status
export const selectServerStatus = createSelector(
  selectHealthState,
  (healthState) => healthState.server
);

// Selector to get the database service status
export const selectDatabaseStatus = createSelector(
  selectHealthState,
  (healthState) => healthState.services.database.status
);

// Selector to get the pool service status
export const selectPoolStatus = createSelector(
  selectHealthState,
  (healthState) => healthState.services.pool.status
);

// Selector to get the last updated timestamp
export const selectHealthTimestamp = createSelector(
  selectHealthState,
  (healthState) => healthState.timestamp
);

// Selector to check if the server is healthy
export const isServerHealthy = createSelector(
  selectServerStatus,
  (serverStatus) => serverStatus === 'healthy'
);
