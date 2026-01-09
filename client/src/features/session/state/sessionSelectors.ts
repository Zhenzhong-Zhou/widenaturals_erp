import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector — returns the full session slice.
 *
 * Intended for composition only.
 * This selector should not be consumed directly by UI components.
 */
const selectSessionState = createSelector(
  [selectRuntime],
  (runtime) => runtime.session
);

/**
 * Selector: returns the current in-memory access token, if present.
 *
 * Semantics:
 * - A non-null value indicates authenticated capability
 * - A null value indicates no authenticated capability
 *
 * Notes:
 * - The access token is ephemeral and not persisted across reloads
 * - Token presence does not imply permission readiness
 */
export const selectAccessToken = createSelector(
  [selectSessionState],
  (state) => state.accessToken
);

/**
 * Selector: returns whether the client currently has authenticated capability.
 *
 * Authentication semantics:
 * - true  → a valid in-memory access token is present
 * - false → no authenticated capability
 *
 * IMPORTANT:
 * - This selector reflects authentication capability only
 * - It MUST NOT infer bootstrap or resolution state
 * - Callers are responsible for gating usage via bootstrap flags
 */
export const selectIsAuthenticated = createSelector(
  [selectAccessToken],
  (accessToken) => Boolean(accessToken)
);

/**
 * Selector: returns whether the session is currently resolving.
 *
 * Resolution semantics:
 * - true  → session bootstrap or refresh is in progress
 * - false → no session mutation is currently occurring
 */
export const selectSessionResolving = createSelector(
  [selectSessionState],
  (state) => state.resolving
);

/**
 * Selector: returns whether the session bootstrap lifecycle has completed.
 *
 * Bootstrap semantics:
 * - true  → initial session evaluation has finished
 * - false → session state may still be indeterminate
 *
 * Notes:
 * - A false value does not imply unauthenticated state
 * - Consumers must not infer authentication from this selector alone
 */
export const selectSessionBootstrapped = createSelector(
  [selectSessionState],
  (state) => state.bootstrapped
);
