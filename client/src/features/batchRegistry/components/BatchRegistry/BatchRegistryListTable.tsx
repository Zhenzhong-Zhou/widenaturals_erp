import { Suspense, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import CustomTable from '@components/common/CustomTable';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import type {
  FlattenedBatchRegistryRecord,
} from '@features/batchRegistry/state';
import {
  BatchRegistryExpandedContent,
  getBatchRegistryTableColumns,
} from '@features/batchRegistry/components/BatchRegistry';

interface BatchRegistryListTableProps {
  data: FlattenedBatchRegistryRecord[];
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

/**
 * Table component for displaying batch registry records.
 *
 * Provides:
 * - paginated table rendering
 * - sortable columns
 * - expandable rows with lazy-loaded detail content
 * - refresh and selection support
 */
const BatchRegistryListTable = ({
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
                                }: BatchRegistryListTableProps) => {
  // ----------------------------------------
  // Column definitions
  // ----------------------------------------
  const columns = useMemo(
    () =>
      getBatchRegistryTableColumns(
        expandedRowId ?? undefined,
        onDrillDownToggle
      ),
    [expandedRowId, onDrillDownToggle]
  );
  
  // ----------------------------------------
  // Expanded row renderer (lazy)
  // ----------------------------------------
  const renderExpandedContent = useCallback(
    (row: FlattenedBatchRegistryRecord) => (
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
        <BatchRegistryExpandedContent row={row} />
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
          Batch Registry
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
        selectedRowIds={selectedRowIds}
        onSelectionChange={onSelectionChange}
        emptyMessage="No batch registry records found"
      />
    </Box>
  );
};

export default BatchRegistryListTable;
