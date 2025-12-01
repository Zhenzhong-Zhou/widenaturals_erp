import { Suspense, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import useCreateSkuSharedLogic from '@features/sku/hook/useCreateSkuSharedLogic';
import CustomTable from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import {
  getSkuListTableColumns,
  SkuExpandedContent,
} from '@features/sku/components/SkuListTable';
import type { FlattenedSkuRecord } from '@features/sku/state';

interface SkuListTableProps {
  data: FlattenedSkuRecord[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  expandedRowId?: string | null;
  onSelectionChange?: (ids: string[]) => void;
  selectedRowIds?: string[];
  onDrillDownToggle?: (rowId: string) => void;
  onRefresh: () => void;
}

const SkuListTable = ({
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
                        selectedRowIds,
                        onSelectionChange,
                        onRefresh,
                      }: SkuListTableProps) => {
  // Shared logic used for permission checks (e.g. canCreateSku)
  const shared = useCreateSkuSharedLogic();
  
  /* -------------------------------------------------------
   * Memoize column definitions
   * - Prevents recalculating columns on every render
   * - Stable unless expandedRowId or toggle handler changes
   * ------------------------------------------------------- */
  const columns = useMemo(() => {
    return getSkuListTableColumns(
      expandedRowId ?? undefined,
      onDrillDownToggle
    );
  }, [expandedRowId, onDrillDownToggle]);
  
  /* -------------------------------------------------------
   * Expanded row content (lazy-loaded)
   * - Suspense allows loading skeleton while chunk loads
   * - useCallback ensures stable function reference
   * ------------------------------------------------------- */
  const renderExpandedContent = useCallback(
    (row: FlattenedSkuRecord) => (
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
        <SkuExpandedContent row={row} />
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
          SKU List
        </CustomTypography>
        
        <Box display="flex" gap={2}>
          {/* Only show Add New if user has permission */}
          {shared.canCreateSku && (
            <CustomButton
              component={Link}
              to="/skus/new"
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
        getRowId={(row) => row.skuId ?? ''}
        selectedRowIds={selectedRowIds}
        onSelectionChange={onSelectionChange}
        emptyMessage="No SKUs found"
      />
    </Box>
  );
};

export default SkuListTable;
