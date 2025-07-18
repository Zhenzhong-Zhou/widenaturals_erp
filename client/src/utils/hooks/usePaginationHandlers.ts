import { useCallback } from 'react';

export const usePaginationHandlers = (
  setPage: (page: number) => void,
  setLimit: (limit: number) => void
) => {
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage + 1); // 1-based
    },
    [setPage]
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
