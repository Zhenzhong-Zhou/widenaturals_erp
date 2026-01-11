import { DEFAULT_PAGINATION, type Pagination } from '@shared-types/pagination';

/**
 * Normalizes an optional or nullable pagination object.
 *
 * Ensures a stable and complete pagination structure by falling back
 * to the canonical DEFAULT_PAGINATION when no pagination data is present.
 *
 * Intended usage:
 * - Adapters transforming API or Redux state into UI-safe data
 * - Selectors or hooks that must tolerate null or undefined pagination
 * - Defensive normalization at feature boundaries
 *
 * This helper is deliberately:
 * - Pure (no side effects)
 * - Deterministic
 * - UI-agnostic
 *
 * @param pagination - Pagination metadata from API, Redux, or adapters
 * @returns A guaranteed, fully-defined Pagination object
 */
export const normalizePagination = (
  pagination?: Pagination | null
): Pagination => pagination ?? DEFAULT_PAGINATION;
