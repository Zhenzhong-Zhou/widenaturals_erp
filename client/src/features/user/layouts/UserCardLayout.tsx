import { type FC } from 'react';
import Stack from '@mui/material/Stack';
import PageShell from '@features/user/layouts/PageShell';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import CustomPagination from '@components/common/CustomPagination';
import {
  UserCardGrid,
  UserFilterAndSortPanel,
} from '@features/user/components/UserView';
import type { UserPageController } from '@features/user/types/hookTypes';

const PAGE_ACTION_BUTTON_SX = {
  width: 150,
  height: 48,
  fontSize: 15,
};

/**
 * Card-based layout for browsing users.
 *
 * Responsibilities:
 * - Renders filter and sort controls
 * - Displays users in a responsive card grid
 * - Handles page-based pagination
 *
 * Design notes:
 * - Data fetching and state are delegated to the user page controller
 * - This layout is specific to the card view
 */
const UserCardLayout: FC<{ controller: UserPageController }> = ({
  controller,
}) => {
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
    error,
    refresh,
    pageInfo,
    paginationHandlers,
  } = controller;
  const { page, limit, totalPages, totalRecords } = pageInfo;

  return (
    <PageShell
      title="Users"
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          <GoBackButton
            size="small"
            variant="outlined"
            sx={PAGE_ACTION_BUTTON_SX}
          />

          <CustomButton
            size="small"
            variant="contained"
            onClick={refresh}
            sx={PAGE_ACTION_BUTTON_SX}
          >
            Refresh
          </CustomButton>
        </Stack>
      }
    >
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
      {/* -----------------------------------------
       * Card Grid
       * ----------------------------------------- */}
      <UserCardGrid
        users={data}
        loading={loading}
        error={error}
        onResetFilters={handleResetFilters}
      />

      {/* -----------------------------------------
       * Pagination
       * ----------------------------------------- */}
      {!loading && totalRecords > 0 && (
        <CustomPagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          itemsPerPage={limit}
          onPageChange={paginationHandlers.handlePageChange}
        />
      )}
    </PageShell>
  );
};

export default UserCardLayout;
