import { Suspense, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import CustomTable from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import {
  getProductListTableColumns,
  ProductExpandedContent,
} from '@features/product/components/ProductListTable';
import type { FlattenedProductRecord } from '@features/product/state/productTypes';

/**
 * Props for the Product list table.
 */
interface ProductListTableProps {
  data: FlattenedProductRecord[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  expandedRowId?: string | null;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onDrillDownToggle?: (rowId: string) => void;
  onRefresh: () => void;
  onAddNew: () => void;
}

/**
 * Product List Table Component
 *
 * Matches the structure of SkuListTable for a uniform UX across the app.
 */
const ProductListTable = ({
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
  onAddNew,
}: ProductListTableProps) => {
  // -------------------------------------------------------
  // Memoize Column Definitions
  // -------------------------------------------------------
  const columns = useMemo(() => {
    return getProductListTableColumns(
      expandedRowId ?? undefined,
      onDrillDownToggle
    );
  }, [expandedRowId, onDrillDownToggle]);

  // -------------------------------------------------------
  // Expanded Row Content (Lazy Loaded)
  // -------------------------------------------------------
  const renderExpandedContent = useCallback(
    (row: FlattenedProductRecord) => (
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
        <ProductExpandedContent row={row} />
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
          Product List
        </CustomTypography>

        <Box display="flex" gap={2}>
          <CustomButton
            onClick={onAddNew}
            variant="contained"
            sx={{ color: 'primary.secondary', fontWeight: 500 }}
          >
            Add New
          </CustomButton>

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
        getRowId={(row) => row.productId}
        selectedRowIds={selectedRowIds}
        onSelectionChange={onSelectionChange}
        emptyMessage="No products found"
      />
    </Box>
  );
};

export default ProductListTable;
