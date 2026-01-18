import {
  UserCardView,
  UserFilters,
  UserListView,
  UserSortField,
} from '@features/user/state';
import {
  useRoleLookup,
  useStatusLookup
} from '@hooks/index';

/**
 * Lookup data contract consumed by the User filter panel.
 *
 * Defines the lookup-backed datasets required to render
 * user list and card view filters (e.g. status, role).
 *
 * Design notes:
 * - This interface represents a UI-facing contract, not
 *   hook implementation details.
 * - Each lookup encapsulates its own loading, pagination,
 *   options, and error state.
 * - Lookups are expected to be present and ready for use
 *   when the filter panel is rendered.
 */
export interface UserFiltersPanelLookups {
  /** User status lookup (active, inactive, suspended, etc.) */
  status: ReturnType<typeof useStatusLookup>;
  
  /** User role lookup (admin, manager, staff, etc.) */
  role: ReturnType<typeof useRoleLookup>;
}

/**
 * UI handlers associated with lookup lifecycle.
 *
 * Used to:
 * - lazily fetch lookup data on open
 * - reset lookup state when filters are cleared
 */
export interface UserLookupHandlers {
  /** Handlers triggered when lookup UI elements open */
  onOpen: {
    status: () => void;
    role: () => void;
  };
}

/**
 * Base pagination handlers shared across
 * card and list views.
 *
 * Page numbers are 1-based at the controller level.
 */
export interface BasePaginationHandlers {
  /** Navigate to a different page */
  handlePageChange: (page: number) => void;
}

/**
 * Pagination handlers specific to table (list) views.
 *
 * Extends base pagination with row-count control.
 */
export interface TablePaginationHandlers<Limit extends number = number>
  extends BasePaginationHandlers {
  /** Change number of rows displayed per page */
  handleRowsPerPageChange: (limit: Limit) => void;
}

/**
 * Public controller contract for user pages.
 *
 * This interface defines the **stable, view-facing API**
 * exposed by `useUserPageController` and consumed by
 * layout components such as `UserCardLayout` and
 * `UserListLayout`.
 *
 * Design principles:
 * - Describes **what the UI can use**, not how data is produced
 * - Abstracts away internal hook state (effects, debouncing, Redux)
 * - Supports both card and list representations via one contract
 *
 * Scope:
 * - Page-level concerns only:
 *   - data
 *   - loading / error
 *   - pagination
 *   - filtering & sorting
 *   - lookup state
 *
 * Notes:
 * - `data` contains raw API records in either
 *   `UserCardView` or `UserListView` shape
 * - Consumers must treat records as view-appropriate
 */
export interface UserPageController {
  /** Current view mode */
  viewMode: 'card' | 'list';

  /** Raw user records returned by the API */
  data: Array<UserCardView | UserListView>;

  /** Loading state */
  loading: boolean;

  /** Error message, if any */
  error?: string | null;

  /** Trigger a refetch using the current query state */
  refresh: () => void;

  // -----------------------------
  // Pagination (shared)
  // -----------------------------

  /** Pagination metadata */
  pageInfo: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };

  /** Page-based pagination handlers */
  paginationHandlers: BasePaginationHandlers;

  // -----------------------------
  // Filters & sorting (shared)
  // -----------------------------

  /** Active user filters */
  filters: UserFilters;

  /** Active sort field */
  sortBy: UserSortField;

  /** Active sort order */
  sortOrder: 'ASC' | 'DESC' | '';

  /** Update active filters */
  setFilters: (filters: UserFilters) => void;

  /** Update sort field */
  setSortBy: (sortBy: UserSortField) => void;

  /** Update sort order */
  setSortOrder: (order: 'ASC' | 'DESC' | '') => void;

  /**
   * Reset filters, sorting, and pagination
   * back to their default state.
   */
  handleResetFilters: () => void;

  // -----------------------------
  // Lookups (shared)
  // -----------------------------

  /** Lookup data & state used by filter UI */
  lookups: UserFiltersPanelLookups;

  /** Lookup lifecycle handlers */
  lookupHandlers: UserLookupHandlers;
}

/**
 * Controller contract for list (table) user pages.
 *
 * Extends the base controller with table-only concerns
 * such as row expansion and page-size control.
 */
export interface UserListPageController<
  Limit extends number = number
> extends UserPageController {
  // -----------------------------
  // Table-only concerns
  // -----------------------------
  
  /** Currently expanded row ID */
  expandedRowId: string | null;
  
  /** Toggle row expansion */
  handleDrillDownToggle: (id: string) => void;
  
  /** Table-specific pagination handlers */
  paginationHandlers: TablePaginationHandlers<Limit>;
}
