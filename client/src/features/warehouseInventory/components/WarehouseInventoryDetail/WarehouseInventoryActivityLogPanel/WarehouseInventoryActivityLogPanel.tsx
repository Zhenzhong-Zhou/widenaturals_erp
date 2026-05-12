import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Box, Stack } from '@mui/material';
import {
  CustomButton,
  CustomTable,
  CustomTypography,
  ErrorMessage,
  Loading,
} from '@components/index';
import {
  ActivityLogToolbar,
  WarehouseInventoryActivityLogExpandedContent,
} from '@features/warehouseInventory/components/WarehouseInventoryDetail/WarehouseInventoryActivityLogPanel';
import { useInventoryActivityLog } from '@hooks/index';
import { usePaginationHandlers } from '@utils/hooks';
import type {
  InventoryActivityLogFilters,
  InventoryActivityLogRecord,
} from '@features/warehouseInventory/state';
import { getInventoryActivityLogColumns } from './getInventoryActivityLogColumns';


type WarehouseInventoryActivityLogPanelProps = {
  warehouseId: string;
  warehouseInventoryId: string;
};

const hasActiveFilters = (filters: InventoryActivityLogFilters) =>
  Object.values(filters).some((value) => value !== undefined && value !== null && value !== '');

const WarehouseInventoryActivityLogPanel: FC<
  WarehouseInventoryActivityLogPanelProps
> = ({ warehouseId, warehouseInventoryId }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<InventoryActivityLogFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const {
    data,
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
  
  const handleDrillDownToggle = useCallback((id: string) => {
    setExpandedRowId((currentId) => (currentId === id ? null : id));
  }, []);
  
  const handleFiltersChange = useCallback(
    (next: InventoryActivityLogFilters) => {
      setFilters(next);
      setPage(1);
      setExpandedRowId(null);
    },
    []
  );
  
  const handleReset = useCallback(() => {
    setFilters({});
    setPage(1);
    setExpandedRowId(null);
  }, []);
  
  const columns = useMemo(
    () =>
      getInventoryActivityLogColumns({
        canViewDetail: true,
        expandedRowId,
        handleDrillDownToggle,
      }),
    [expandedRowId, handleDrillDownToggle]
  );
  
  const renderExpandedContent = useCallback(
    (row: InventoryActivityLogRecord) => (
      <WarehouseInventoryActivityLogExpandedContent row={row} />
    ),
    []
  );
  
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
        <CustomTable<InventoryActivityLogRecord>
          columns={columns}
          data={data}
          expandable
          expandedRowId={expandedRowId}
          expandedContent={renderExpandedContent}
          page={page - 1}
          initialRowsPerPage={limit}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </Stack>
  );
};

export default WarehouseInventoryActivityLogPanel;
