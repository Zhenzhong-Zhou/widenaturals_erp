import { Suspense, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import useCreateSkuSharedLogic from '@features/sku/hook/useCreateSkuSharedLogic';
import { usePagePermissionState } from '@features/authorize/hooks';
import CustomTable, { CustomTableProps } from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import {
  getSkuListTableColumns,
  SkuExpandedContent,
} from '@features/sku/components/SkuListTable';
import { FlattenedSkuRecord, SelectedSku } from '@features/sku/state';

interface SkuListTableProps extends Omit<
  CustomTableProps<FlattenedSkuRecord>,
  | 'columns'
  | 'rowsPerPageOptions'
  | 'initialRowsPerPage'
  | 'getRowId'
  | 'expandable'
  | 'expandedContent'
> {
  /** Controlled rows-per-page value */
  rowsPerPage: number;

  /** Currently expanded SKU row id */
  expandedRowId?: string | null;

  /** Toggle SKU drilldown panel */
  onDrillDownToggle?: (rowId: string) => void;

  /** Row selection change handler */
  onSelectionChange?: (ids: string[]) => void;

  /** Currently selected row ids */
  selectedRowIds?: string[];

  /** Selected SKU metadata map */
  selectedSkus?: Record<string, SelectedSku>;

  /** Manual refresh trigger */
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
  selectedSkus,
  onSelectionChange,
  onRefresh,
}: SkuListTableProps) => {
  // Shared logic used for permission checks (e.g. canCreateSku)
  const shared = useCreateSkuSharedLogic();
  const { isAllowed } = usePagePermissionState(['create_skus_images']);

  const getSelectedSkuCount = (
    selectedSkus?: Record<string, SelectedSku>
  ): number => {
    if (!selectedSkus) return 0;
    return Object.keys(selectedSkus).length;
  };

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

  const selectedCount = useMemo(
    () => getSelectedSkuCount(selectedSkus),
    [selectedSkus]
  );

  const isSelectableSku = (row: FlattenedSkuRecord) =>
    Boolean(!row.primaryImageUrl);

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

          {isAllowed && (
            <CustomButton
              component={Link}
              to="/sku-images/upload"
              state={{ selectedSkus: Object.values(selectedSkus ?? {}) }}
              variant="contained"
              disabled={selectedCount === 0}
              sx={{ color: 'primary.secondary', fontWeight: 500 }}
            >
              Bulk Upload Images {selectedCount > 0 ? `(${selectedCount})` : ''}
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
        showCheckboxes={isAllowed}
        isRowSelectable={isSelectableSku}
        emptyMessage="No SKUs found"
      />
    </Box>
  );
};

export default SkuListTable;
