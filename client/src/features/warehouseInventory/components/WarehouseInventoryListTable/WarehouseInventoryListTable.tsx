import { Suspense, useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow,
} from '@components/index';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';
import {
  getWarehouseInventoryColumns,
  WarehouseInventoryExpandedContent,
} from '@features/warehouseInventory/components/WarehouseInventoryListTable';

interface WarehouseInventoryListTableProps {
  data: FlattenedWarehouseInventory[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
  canViewDetail?: boolean;
  canAdjust?: boolean;
  canUpdateStatus?: boolean;
}

/**
 * Warehouse Inventory List Table Component
 *
 * Paginated table for warehouse inventory records.
 * Drill-down is gated by canViewDetail.
 * canAdjust and canUpdateStatus flow through to the expanded row content
 * for adjust / update-status actions.
 */
const WarehouseInventoryListTable = ({
                                       data,
                                       loading,
                                       page,
                                       totalPages,
                                       totalRecords,
                                       rowsPerPage,
                                       onPageChange,
                                       onRowsPerPageChange,
                                       onRefresh,
                                       canViewDetail = false,
                                       canAdjust = false,
                                       canUpdateStatus = false,
                                     }: WarehouseInventoryListTableProps) => {
  // -------------------------------------------------------
  // Drill-down state
  // -------------------------------------------------------
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };
  
  // -------------------------------------------------------
  // Memoize Column Definitions
  // -------------------------------------------------------
  const columns = useMemo(
    () =>
      getWarehouseInventoryColumns({
        canViewDetail,
        expandedRowId,
        handleDrillDownToggle,
      }),
    [canViewDetail, expandedRowId]
  );
  
  // -------------------------------------------------------
  // Expanded Row Content
  // -------------------------------------------------------
  const renderExpandedContent = useCallback(
    (row: FlattenedWarehouseInventory) => (
      <Suspense
        fallback={
          <SkeletonExpandedRow
            showSummary
            fieldPairs={4}
            summaryHeight={80}
            spacing={1}
          />
        }
      >
        <WarehouseInventoryExpandedContent
          row={row}
          canAdjust={canAdjust}
          canUpdateStatus={canUpdateStatus}
        />
      </Suspense>
    ),
    [canAdjust, canUpdateStatus]
  );
  
  return (
    <Box>
      {/* ----------------------------------------- */}
      {/* TABLE HEADER                              */}
      {/* ----------------------------------------- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Inventory
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
      {/* MAIN TABLE                                */}
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
        getRowId={(row) => row.id}
        emptyMessage="No inventory records found"
      />
    </Box>
  );
};

export default WarehouseInventoryListTable;
