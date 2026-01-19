import { type FC } from 'react';
import PageShell from '@features/user/layouts/PageShell.tsx';
import {
  UserFilterAndSortPanel,
  UserListTable,
} from '@features/user/components/UserView';
import useFlattenedUsers from '@features/user/hooks/useFlattenedUsers';
import type { UserListPageController } from '@features/user/types/hookTypes';
import type { UserTablePageSize } from '@features/user/config/userTableConfig';

/**
 * List (table) layout for the Users page.
 *
 * Responsibilities:
 * - Renders filter and sort controls for user management
 * - Displays users in a paginated, expandable table
 * - Bridges controller state to table-specific APIs
 *
 * Design notes:
 * - This layout adapts 1-based pagination (API) to
 *   0-based pagination (MUI TablePagination)
 * - All business logic and data fetching are delegated
 *   to the user page controller
 * - This component is list-view specific
 */
const UserListLayout: FC<{
  controller: UserListPageController<UserTablePageSize>;
}> = ({ controller }) => {
  const {
    data,
    filters,
    lookups,
    lookupHandlers,
    sortBy,
    sortOrder,
    setFilters,
    setSortBy,
    setSortOrder,
    handleResetFilters,
    loading,
    pageInfo,
    paginationHandlers,
    expandedRowId,
    handleDrillDownToggle,
    refresh,
  } = controller;
  const { page, limit, totalPages, totalRecords } = pageInfo;
  const { handlePageChange, handleRowsPerPageChange } = paginationHandlers;
  const flattenedUsers = useFlattenedUsers(data);

  return (
    <PageShell title="User Management">
      <UserFilterAndSortPanel
        filters={filters}
        lookups={lookups}
        lookupHandlers={lookupHandlers}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onFiltersChange={setFilters}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onReset={handleResetFilters}
      />

      <UserListTable
        data={flattenedUsers}
        loading={loading}
        page={page - 1}
        rowsPerPage={limit}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onRowsPerPageChange={(value: number) =>
          handleRowsPerPageChange(value as UserTablePageSize)
        }
        expandedRowId={expandedRowId}
        onDrillDownToggle={handleDrillDownToggle}
        onRefresh={refresh}
      />
    </PageShell>
  );
};

export default UserListLayout;
