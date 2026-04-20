import { Suspense, useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  SkeletonExpandedRow,
} from '@components/index';
import type { WarehouseRecord } from '@features/warehouse';
import {
  getWarehouseColumns,
  WarehouseExpandedContent
} from '@features/warehouse/components/WarehouseListTable';

interface WarehouseListTableProps {
  data: WarehouseRecord[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
  canViewSummary?: boolean;
  canViewDetails?:   boolean;
  canViewInventory?: boolean;
}

/**
 * Warehouse List Table Component
 *
 * Paginated table for the warehouse list view.
 * Inventory summary columns are conditionally rendered based on canViewSummary.
 */
const WarehouseListTable = ({
                              data,
                              loading,
                              page,
                              totalPages,
                              totalRecords,
                              rowsPerPage,
                              onPageChange,
                              onRowsPerPageChange,
                              onRefresh,
                              canViewSummary = false,
                              canViewDetails = false,
                              canViewInventory = true,
                            }: WarehouseListTableProps) => {
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
    () => getWarehouseColumns({
      canViewSummary,
      canViewDetails,
      canViewInventory,
      expandedRowId,
      handleDrillDownToggle,
    }),
    [canViewSummary, canViewDetails, canViewInventory, expandedRowId]
  );
  
  // -------------------------------------------------------
  // Expanded Row Content
  // -------------------------------------------------------
  const renderExpandedContent = useCallback(
    (row: WarehouseRecord) => (
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
        <WarehouseExpandedContent row={row} />
      </Suspense>
    ),
    []
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
          Warehouses
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
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={renderExpandedContent}
        getRowId={(row) => row.id}
        emptyMessage="No warehouses found"
      />
    </Box>
  );
};

export default WarehouseListTable;
