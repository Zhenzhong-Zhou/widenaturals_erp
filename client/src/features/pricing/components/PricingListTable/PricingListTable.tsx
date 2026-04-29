import { Suspense, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow,
} from '@components/index';
import {
  getPricingListTableColumns,
  PricingExpandedContent
} from '@features/pricing/components/PricingListTable';
import type {
  FlattenedPricingJoinRecord,
} from '@features/pricing';

/**
 * Props for the Pricing list table.
 */
interface PricingListTableProps {
  data: FlattenedPricingJoinRecord[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  expandedRowId?: string | null;
  onDrillDownToggle?: (rowId: string) => void;
  onRefresh: () => void;
}

/**
 * Pricing List Table Component
 *
 * Read-only paginated table for the joined pricing view.
 * Includes export action with format selection.
 */
const PricingListTable = ({
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
                          }: PricingListTableProps) => {
  // -------------------------------------------------------
  // Memoize Column Definitions
  // -------------------------------------------------------
  const columns = useMemo(() => {
    return getPricingListTableColumns(expandedRowId ?? undefined, onDrillDownToggle);
  }, [expandedRowId, onDrillDownToggle]);
  
  // -------------------------------------------------------
  // Expanded Row Content (Lazy Loaded)
  // -------------------------------------------------------
  const renderExpandedContent = useCallback(
    (row: FlattenedPricingJoinRecord) => (
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
        <PricingExpandedContent row={row} />
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
          Pricing List
        </CustomTypography>
        
        <Box display="flex" gap={2} alignItems="center">
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
        rowsPerPageOptions={[25, 50, 75, 100]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={renderExpandedContent}
        getRowId={(row) => row.pricingId}
        emptyMessage="No pricing records found"
      />
    </Box>
  );
};

export default PricingListTable;
