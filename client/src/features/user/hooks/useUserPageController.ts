import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  UserFilters,
  UserSortField,
  UserViewMode,
} from '@features/user/state';
import useUserLookups from '@features/user/hooks/useUserLookups';
import { usePaginatedUsers } from '@hooks/index';
import { usePaginationHandlers } from '@utils/hooks';
import { getInitialUserLimit } from '@features/user/utils';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';
import { UserTablePageSize } from '@features/user/config/userTableConfig';

interface UseUserPageControllerOptions {
  viewMode: UserViewMode;
}

const useUserPageController = ({ viewMode }: UseUserPageControllerOptions) => {
  // -----------------------------
  // UI state (page-scoped)
  // -----------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<UserTablePageSize>(() =>
    getInitialUserLimit(viewMode)
  );
  const [sortBy, setSortBy] = useState<UserSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<UserFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const usersState = usePaginatedUsers();
  const lookups = useUserLookups();

  // -----------------------------
  // Query model (explicit intent)
  // -----------------------------
  const query = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      viewMode,
    }),
    [page, limit, sortBy, sortOrder, filters, viewMode]
  );

  const refresh = useCallback(() => {
    usersState.fetchUsers(query);
  }, [query, usersState.fetchUsers]);

  const queryParams = useMemo(
    () => ({
      ...query,
      fetchFn: refresh,
    }),
    [query, refresh]
  );

  // -----------------------------
  // Debounced fetch
  // -----------------------------
  useEffect(() => {
    const t = setTimeout(() => applyFiltersAndSorting(queryParams), 200);
    return () => clearTimeout(t);
  }, [queryParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      usersState.resetUsers();
    };
  }, [usersState.resetUsers]);

  // -----------------------------
  // Lookup handlers
  // -----------------------------
  const lookupHandlers = useMemo(
    () => ({
      resetAll: () => {
        lookups.status.reset();
        lookups.role.reset();
      },
      onOpen: {
        status: createLazyOpenHandler(
          lookups.status.options,
          lookups.status.fetch
        ),
        role: createLazyOpenHandler(lookups.role.options, lookups.role.fetch),
      },
    }),
    [lookups]
  );

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const paginationMode = viewMode === 'card' ? 'page' : 'table';

  const paginationHandlers = usePaginationHandlers(
    setPage,
    setLimit,
    paginationMode
  );

  const handleDrillDownToggle = useCallback((rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  }, []);

  return {
    // intent
    viewMode,

    // query state
    page,
    limit,
    sortBy,
    sortOrder,
    filters,

    setPage,
    setLimit,
    setSortOrder,
    setSortBy,
    setFilters,

    expandedRowId,
    handleDrillDownToggle,

    lookups,
    lookupHandlers,
    handleResetFilters,

    paginationHandlers,

    // data
    ...usersState,

    refresh,
  };
};

export default useUserPageController;
