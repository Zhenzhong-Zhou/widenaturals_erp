import { current, type Draft } from '@reduxjs/toolkit';
import type { PaginatedLookupState } from '@shared-types/api';
import { dedupeById } from '@utils/dedupeHelpers';

/**
 * Represents a generic paginated response payload.
 *
 * @template T - The type of items contained in the payload.
 */
export interface PaginatedPayload<T> {
  /** The list of items returned in the current page. */
  items: T[];

  /** Indicates whether there are more items available beyond the current page. */
  hasMore?: boolean;

  /** The number of items per page. */
  limit?: number;

  /** The offset of the current page (number of items skipped). */
  offset?: number;
}

/**
 * Applies a paginated fulfilled response to the Redux Draft state.
 *
 * - Appends the new items to the current state if `offset > 0`, otherwise replaces the state.
 * - Deduplicates the result by `id`.
 * - Resets loading and error states.
 * - Updates pagination metadata (`hasMore`, `limit`, `offset`).
 *
 * @template T - A type with a unique `id` field.
 * @param state - The Draft state object representing the paginated lookup state.
 * @param payload - The paginated payload received from a fulfilled API response.
 */
export const applyPaginatedFulfilled = <T extends { id: string }>(
  state: Draft<PaginatedLookupState<T>>,
  payload: PaginatedPayload<T>
) => {
  const { items, hasMore, limit, offset } = payload;

  const existing = offset === 0 ? [] : current(state.data);
  const combined = [...existing, ...items];

  state.data = dedupeById(combined) as Draft<T>[];
  state.loading = false;
  state.error = null;
  state.hasMore = hasMore ?? false;
  state.limit = limit ?? 50;
  state.offset = offset ?? 0;
};
