import { Suspense, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import {
  ComplianceRecordExpandedContent,
  getComplianceRecordListTableColumns,
} from '@features/complianceRecord/components/ComplianceRecordListTable';
import CustomTable, { CustomTableProps } from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import { ComplianceRecordTableRow } from '@features/complianceRecord/state';

interface ComplianceListTableProps extends Omit<
  CustomTableProps<ComplianceRecordTableRow>,
  | 'columns'
  | 'rowsPerPageOptions'
  | 'initialRowsPerPage'
  | 'getRowId'
  | 'expandable'
  | 'expandedContent'
> {
  /** Controlled rows-per-page value */
  rowsPerPage: number;

  /** Currently expanded row id (compliance-specific drilldown) */
  expandedRowId?: string | null;

  /** Toggle compliance drilldown panel */
  onDrillDownToggle?: (rowId: string) => void;

  /** Manual refresh trigger */
  onRefresh: () => void;
}

const ComplianceRecordListTable = ({
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
}: ComplianceListTableProps) => {
  /* -------------------------------------------------------
   * Memoize column definitions
   * - Prevents recalculating columns on every render
   * - Stable unless expandedRowId or toggle handler changes
   * ------------------------------------------------------- */
  const columns = useMemo(() => {
    return getComplianceRecordListTableColumns(
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
    (row: ComplianceRecordTableRow) => (
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
        <ComplianceRecordExpandedContent row={row} />
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
          Compliance List
        </CustomTypography>

        <Box display="flex" gap={2}>
          {/*/!* Only show Add New if user has permission *!/*/}
          {/*{shared.canCreateSku && (*/}
          {/*  <CustomButton*/}
          {/*    component={Link}*/}
          {/*    to="/skus/new"*/}
          {/*    variant="contained"*/}
          {/*    sx={{ color: 'primary.secondary', fontWeight: 500 }}*/}
          {/*  >*/}
          {/*    Add New*/}
          {/*  </CustomButton>*/}
          {/*)}*/}

          {/*{isAllowed && (*/}
          {/*  <CustomButton*/}
          {/*    component={Link}*/}
          {/*    to="/sku-images/upload"*/}
          {/*    state={{ selectedSkus: Object.values(selectedSkus ?? {}) }}*/}
          {/*    variant="contained"*/}
          {/*    disabled={selectedCount === 0}*/}
          {/*    sx={{ color: 'primary.secondary', fontWeight: 500 }}*/}
          {/*  >*/}
          {/*    Bulk Upload Images {selectedCount > 0 ? `(${selectedCount})` : ''}*/}
          {/*  </CustomButton>*/}
          {/*)}*/}

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
        emptyMessage="No Compliance Records found"
      />
    </Box>
  );
};

export default ComplianceRecordListTable;
