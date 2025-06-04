/**
 * Combines multiple reducer group objects into a single reducer map.
 *
 * This utility is useful when organizing reducers into logical groups
 * (e.g., userReducers, authReducers) and you want to merge them all
 * before passing them to `combineReducers`.
 *
 * @example
 * const rootReducer = combineReducers(
 *   createReducerMap(authReducers, userReducers, productReducers)
 * );
 */
export const createReducerMap = (...groups: Record<string, any>[]) =>
  groups.reduce((acc, curr) => ({ ...acc, ...curr }), {});
