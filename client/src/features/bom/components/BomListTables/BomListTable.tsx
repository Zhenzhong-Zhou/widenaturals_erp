import { Suspense, useCallback, useMemo } from 'react';
import CustomTable from '@components/common/CustomTable';
import type { FlattenedBomRecord } from '@features/bom/state';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import {
  getBomListTableColumns,
  BomExpandedContent,
} from '@features/bom/components/BomListTables';

interface BomListTableProps {
  data: FlattenedBomRecord[];
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

const BomListTable = ({
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
}: BomListTableProps) => {
  // --- Columns definition ---
  const columns = useMemo(() => {
    return getBomListTableColumns(
      expandedRowId ?? undefined,
      onDrillDownToggle
    );
  }, [expandedRowId, onDrillDownToggle]);

  const renderExpandedContent = useCallback(
    (row: FlattenedBomRecord) => (
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
        <BomExpandedContent row={row} />
      </Suspense>
    ),
    []
  );

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Bom List
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
        getRowId={(row) => row.bomId}
        selectedRowIds={selectedRowIds}
        onSelectionChange={onSelectionChange}
        emptyMessage="No boms found"
      />
    </Box>
  );
};

export default BomListTable;
