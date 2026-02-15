import { useCallback, type Dispatch, type SetStateAction } from 'react';

type PaginationMode = 'table' | 'page';

/**
 * Pagination handler utility for normalizing pagination behavior
 * across different UI components and pagination conventions.
 *
 * This hook bridges the differences between:
 * - **Table-based pagination** (e.g. MUI `TablePagination`)
 *   → 0-based page indices
 * - **Page-based pagination** (e.g. MUI `Pagination`)
 *   → 1-based page indices
 *
 * Responsibilities:
 * - Converts UI page indices into API-friendly 1-based pages
 * - Resets the current page when the page size changes
 * - Centralizes pagination logic to avoid duplication across layouts
 *
 * Usage:
 * - Card view pages → `mode: 'page'`
 * - List / table pages → `mode: 'table'` (default)
 *
 * Design notes:
 * - The API and backend are assumed to be **1-based**
 * - UI components may vary in index convention
 * - Page size is fully controlled by the caller
 *
 * @template Limit - Numeric page-size type (e.g. `number` or a constrained union)
 * @param setPage - React state dispatcher for the current page (1-based)
 * @param setLimit - React state dispatcher for the page size / rows per page
 * @param mode - Pagination mode (`'table'` or `'page'`)
 *
 * @returns Pagination handler callbacks for page and page-size changes
 */
const usePaginationHandlers = <Limit extends number>(
  setPage: Dispatch<SetStateAction<number>>,
  setLimit: Dispatch<SetStateAction<Limit>>,
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
    (newLimit: Limit) => {
      setLimit(newLimit);
      setPage(1);
    },
    [setLimit, setPage]
  );

  return { handlePageChange, handleRowsPerPageChange };
};

export default usePaginationHandlers;
