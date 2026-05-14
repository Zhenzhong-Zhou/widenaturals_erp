import { type Draft } from '@reduxjs/toolkit';
import { castDraft } from 'immer';
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
 * Applies a paginated fulfilled response to the Redux draft lookup state.
 *
 * - Replaces existing data when `offset === 0`.
 * - Appends new items when loading additional pages.
 * - Deduplicates combined results by `id`, keeping the latest item.
 * - Casts the plain deduped array back into Immer draft form before assignment.
 * - Resets loading and error states.
 * - Updates pagination metadata (`hasMore`, `limit`, `offset`).
 *
 * @template T - A lookup item type with a unique string `id`.
 * @param state - Immer draft state for the paginated lookup slice.
 * @param payload - Paginated lookup payload from a fulfilled API response.
 */
export const applyPaginatedFulfilled = <T extends { id: string }>(
  state: Draft<PaginatedLookupState<T>>,
  payload: PaginatedPayload<T>
) => {
  const { items, hasMore, limit, offset = 0 } = payload;
  
  const existing = offset === 0 ? [] : ([...state.data] as unknown as T[]);
  
  const combined = dedupeById<T>([...existing, ...items]);
  
  state.data = castDraft(combined);
  state.loading = false;
  state.error = null;
  state.hasMore = hasMore ?? false;
  state.limit = limit ?? 50;
  state.offset = offset;
};
