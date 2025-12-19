import { Suspense, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import usePagePermissionGuard from '@features/authorize/hooks/usePagePermissionGuard';
import CustomTable, { CustomTableProps } from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import {
  getUserListTableColumns,
  UserExpandedContent,
} from '@features/user/components/UserView';
import type { FlattenedUserRecord } from '@features/user/state';

interface UserListTableProps
  extends Omit<
    CustomTableProps<FlattenedUserRecord>,
    | 'columns'
    | 'rowsPerPageOptions'
    | 'initialRowsPerPage'
    | 'getRowId'
    | 'expandable'
    | 'expandedContent'
  > {
  /** Controlled rows-per-page value */
  rowsPerPage: number;
  
  /** Currently expanded user row id */
  expandedRowId?: string | null;
  
  /** Toggle user drilldown panel */
  onDrillDownToggle?: (rowId: string) => void;
  
  /** Manual refresh trigger */
  onRefresh: () => void;
}

const UserListTable = ({
                         data,
                         loading,
                         page,
                         totalPages,
                         totalRecords,
                         rowsPerPage,
                         onPageChange,
                         onRowsPerPageChange,
                         expandedRowId,
                         onDrillDownToggle,
                         onRefresh,
                       }: UserListTableProps) => {
  // Permission guard (adjust permission key if needed)
  const { isAllowed } = usePagePermissionGuard(['create_users']);
  
  /* -------------------------------------------------------
   * Memoize column definitions
   * ------------------------------------------------------- */
  const columns = useMemo(
    () =>
      getUserListTableColumns(
        expandedRowId ?? undefined,
        onDrillDownToggle
      ),
    [expandedRowId, onDrillDownToggle]
  );
  
  /* -------------------------------------------------------
   * Expanded row content (lazy-loaded)
   * ------------------------------------------------------- */
  const renderExpandedContent = useCallback(
    (row: FlattenedUserRecord) => (
      <Suspense
        fallback={
          <SkeletonExpandedRow
            showSummary
            fieldPairs={3}
            summaryHeight={80}
            spacing={1}
          />
        }
      >
        <UserExpandedContent row={row} />
      </Suspense>
    ),
    []
  );
  
  return (
    <Box>
      {/* ----------------------------------------- */}
      {/* TABLE HEADER */}
      {/* ----------------------------------------- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          User List
        </CustomTypography>
        
        <Box display="flex" gap={2}>
          {isAllowed && (
            <CustomButton
              component={Link}
              to="/users/new"
              variant="contained"
              sx={{ color: 'primary.secondary', fontWeight: 500 }}
            >
              Add New
            </CustomButton>
          )}
          
          <CustomButton
            onClick={onRefresh}
            variant="outlined"
            sx={{ color: 'primary.main', fontWeight: 500 }}
          >
            Refresh
          </CustomButton>
        </Box>
      </Box>
      
      {/* ----------------------------------------- */}
      {/* MAIN TABLE */}
      {/* ----------------------------------------- */}
      <CustomTable
        data={data}
        columns={columns}
        loading={loading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        initialRowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 75]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={renderExpandedContent}
        getRowId={(row) => row.userId ?? ''}
        emptyMessage="No users found"
      />
    </Box>
  );
};

export default UserListTable;
