import { useCallback, useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  Loading,
} from '@components/index';
import {
  ActivityLogToolbar,
} from '@features/warehouseInventory/components/WarehouseInventoryDetail/WarehouseInventoryActivityLogPanel';
import {
  WarehouseInventoryActivityLogListTable
} from '@features/warehouseInventory/components/WarehouseInventoryActivityLogListTable';
import { useInventoryActivityLog } from '@hooks/index';
import { usePaginationHandlers } from '@utils/hooks';
import type { InventoryActivityLogFilters } from '@features/warehouseInventory/state';

interface WarehouseInventoryActivityLogPanelProps {
  warehouseId: string;
  warehouseInventoryId: string;
}

const hasActiveFilters = (filters: InventoryActivityLogFilters) =>
  Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== ''
  );

/**
 * Embedded activity log panel used inside the warehouse inventory detail page.
 *
 * Locks the inventoryId filter to the current record so the panel always
 * shows activity for one specific inventory entry. For warehouse-wide
 * activity log viewing across all records, see
 * WarehouseInventoryActivityLogPage — both surfaces share the same
 * WarehouseInventoryActivityLogTable, column definitions, and expanded
 * row content. The panel and page diverge only in their toolbars/filter
 * UI and the surrounding chrome.
 *
 * Drill-down state lives inside the table component, so resetting filters
 * from this panel does not need to touch expand state.
 */
const WarehouseInventoryActivityLogPanel = ({
                                              warehouseId,
                                              warehouseInventoryId,
                                            }: WarehouseInventoryActivityLogPanelProps) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<InventoryActivityLogFilters>({});
  
  const {
    data,
    pagination: paginationInfo,
    loading,
    error,
    totalRecords,
    isEmpty,
    fetchActivityLog,
    resetActivityLog,
  } = useInventoryActivityLog();
  
  useEffect(() => {
    fetchActivityLog({
      warehouseId,
      page,
      limit,
      filters: {
        ...filters,
        inventoryId: warehouseInventoryId,
      },
    });
  }, [
    warehouseId,
    warehouseInventoryId,
    page,
    limit,
    filters,
    fetchActivityLog,
  ]);
  
  useEffect(() => {
    return () => {
      resetActivityLog();
    };
  }, [resetActivityLog]);
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );
  
  const handleFiltersChange = useCallback(
    (next: InventoryActivityLogFilters) => {
      setFilters(next);
      setPage(1);
    },
    []
  );
  
  const handleReset = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);
  
  const filtersActive = hasActiveFilters(filters);
  
  return (
    <Stack spacing={2}>
      <ActivityLogToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
      />
      
      {loading && (
        <Loading variant="dotted" message="Loading activity log..." />
      )}
      
      {!loading && error && <ErrorMessage message={error} />}
      
      {!loading && !error && isEmpty && (
        <Box
          sx={{
            py: 4,
            px: 2,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
          }}
        >
          <CustomTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
            No activity recorded yet.
          </CustomTypography>
          
          <CustomTypography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {filtersActive
              ? 'No activity log records match the current filters.'
              : 'This inventory item does not have activity log records yet.'}
          </CustomTypography>
          
          {filtersActive && (
            <CustomButton
              size="small"
              variant="outlined"
              onClick={handleReset}
              sx={{ mt: 2 }}
            >
              Reset filters
            </CustomButton>
          )}
        </Box>
      )}
      
      {!loading && !error && !isEmpty && (
        <WarehouseInventoryActivityLogListTable
          data={data}
          loading={loading}
          page={page - 1}
          rowsPerPage={limit}
          totalPages={paginationInfo?.totalPages ?? 0}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </Stack>
  );
};

export default WarehouseInventoryActivityLogPanel;
