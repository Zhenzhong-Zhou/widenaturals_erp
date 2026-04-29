import { Suspense, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow,
} from '@components/index';
import type { PricingGroupRecord } from '@features/pricingGroup';
import {
  getPricingGroupTableColumns,
  PricingGroupExpandedContent
} from '@features/pricingGroup/components';

interface PricingGroupListTableProps {
  data: PricingGroupRecord[];
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

const PricingGroupListTable = ({
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
                               }: PricingGroupListTableProps) => {
  // ----------------------------------------
  // Column definitions
  // ----------------------------------------
  const columns = useMemo(
    () => getPricingGroupTableColumns(
      false,
      expandedRowId ?? undefined,
      onDrillDownToggle
    ),
    [expandedRowId, onDrillDownToggle]
  );
  
  // ----------------------------------------
  // Expanded row renderer (lazy)
  // ----------------------------------------
  const renderExpandedContent = useCallback(
    (row: PricingGroupRecord) => (
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
        <PricingGroupExpandedContent row={row} />
      </Suspense>
    ),
    []
  );
  
  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <Box>
      {/* Table Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Pricing Groups
        </CustomTypography>
        
        <CustomButton
          onClick={onRefresh}
          variant="outlined"
          sx={{ color: 'primary', fontWeight: 500 }}
        >
          Refresh
        </CustomButton>
      </Box>
      
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
        getRowId={(row) => row.id}
        emptyMessage="No pricing group records found"
      />
    </Box>
  );
};

export default PricingGroupListTable;
