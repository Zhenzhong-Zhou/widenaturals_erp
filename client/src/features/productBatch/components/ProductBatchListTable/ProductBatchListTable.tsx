import { Suspense, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow
} from '@components/index';
import type {
  FlattenedProductBatchRecord,
} from '@features/productBatch/state';
import {
  getProductBatchTableColumns,
  ProductBatchExpandedContent,
} from '@features/productBatch/components/ProductBatchListTable';

interface ProductBatchListTableProps {
  data: FlattenedProductBatchRecord[];
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
 * Table component for displaying product batch records.
 *
 * Provides:
 * - paginated table rendering
 * - sortable columns
 * - expandable rows with lazy-loaded detail content
 * - refresh and selection support
 */
const ProductBatchListTable = ({
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
                               }: ProductBatchListTableProps) => {
  // ----------------------------------------
  // Column definitions
  // ----------------------------------------
  const columns = useMemo(
    () =>
      getProductBatchTableColumns(
        expandedRowId ?? undefined,
        onDrillDownToggle
      ),
    [expandedRowId, onDrillDownToggle]
  );
  
  // ----------------------------------------
  // Expanded row renderer (lazy)
  // ----------------------------------------
  const renderExpandedContent = useCallback(
    (row: FlattenedProductBatchRecord) => (
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
        <ProductBatchExpandedContent row={row} />
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
          Product Batches
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
        emptyMessage="No product batch records found"
      />
    </Box>
  );
};

export default ProductBatchListTable;
