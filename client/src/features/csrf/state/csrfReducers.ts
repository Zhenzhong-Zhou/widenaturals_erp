import csrfReducer from './csrfSlice';

/**
 * Reducer map for CSRF state.
 *
 * Notes:
 * - Slice reducers are imported locally to avoid circular
 *   ESM initialization (TDZ) issues.
 * - Only this reducer group is exposed to the root reducer.
 * - Slice reducers remain private implementation details.
 */
export const csrfReducers = {
  csrf: csrfReducer,
};
