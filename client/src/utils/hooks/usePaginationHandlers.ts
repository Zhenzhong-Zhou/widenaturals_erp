import { useCallback } from 'react';

type PaginationMode = 'table' | 'page';

/**
 * Pagination handler utility for bridging different pagination conventions.
 *
 * This hook normalizes page-change behavior between:
 * - **Table-based pagination** (e.g. MUI `TablePagination`)
 *   → 0-based page index
 * - **Page-based pagination** (e.g. MUI `Pagination`)
 *   → 1-based page index
 *
 * Responsibilities:
 * - Converts UI page indices into API-friendly 1-based pages
 * - Resets page index when rows-per-page changes
 * - Centralizes pagination logic to avoid duplication across layouts
 *
 * Usage:
 * - Card view pages → `mode: 'page'`
 * - List / table pages → `mode: 'table'` (default)
 *
 * Design notes:
 * - The API and backend are assumed to be **1-based**
 * - UI components may vary in index convention
 * - This hook prevents off-by-one bugs at call sites
 *
 * @param setPage - State setter for the current page (1-based)
 * @param setLimit - State setter for the page size / rows per page
 * @param mode - Pagination mode (`'table'` or `'page'`)
 *
 * @returns Pagination handler callbacks
 */
export const usePaginationHandlers = (
  setPage: (page: number) => void,
  setLimit: (limit: number) => void,
  mode: PaginationMode = 'table'
) => {
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (mode === 'table') {
        // TablePagination uses 0-based page indices
        setPage(newPage + 1);
      } else {
        // Pagination uses 1-based page indices
        setPage(newPage);
      }
    },
    [setPage, mode]
  );

  const handleRowsPerPageChange = useCallback(
    (newLimit: number) => {
      setLimit(newLimit);
      setPage(1);
    },
    [setLimit, setPage]
  );

  return { handlePageChange, handleRowsPerPageChange };
};
