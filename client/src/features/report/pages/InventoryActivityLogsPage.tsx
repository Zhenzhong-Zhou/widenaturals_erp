import { type FC, lazy, Suspense, useMemo, useRef } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { usePaginatedInventoryActivityLogs } from '@hooks/useInventoryActivityLogs';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import type { InventoryActivityLogEntry, InventoryActivityLogQueryParams } from '@features/report/state';
import { mergeInventoryActivityLogs, type MergedInventoryActivityLogEntry } from '../utils/logUtils';
import InventoryActivityLogFilterPanel from '../components/InventoryActivityLogFilterPanel';
import useBatchRegistryLookup from '@hooks/useBatchRegistryLookup';
import type {
  BatchLookupOption,
  GetBatchRegistryLookupParams,
  WarehouseLookupItem,
  WarehouseOption,
} from '@features/lookup/state';
import { mapBatchLookupToOptions } from '@features/lookup/utils/batchRegistryUtils';
import useWarehouseLookup from '@hooks/useWarehouseLookup.ts';

const InventoryActivityLogsTable = lazy(() =>
  import('@features/report/components/InventoryActivityLogsTable')
);

const InventoryActivityLogsPage: FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filters, setFilters] = useState<Partial<InventoryActivityLogQueryParams>>({});
  const [stagedFilters, setStagedFilters] = useState<Partial<InventoryActivityLogQueryParams>>({});
  const [selectedBatches, setSelectedBatches] = useState<BatchLookupOption[]>([]);
  const [batchLookupParams, setBatchLookupParams] =
    useState<GetBatchRegistryLookupParams>({
      batchType: '',
      limit: 50,
      offset: 0,
    });
  const [selectedWarehouses, setSelectedWarehouses] = useState<WarehouseOption[]>([]);
  const isFetchingRef = useRef(false);
  
  const {
    data: logData,
    pagination,
    loading: logLoading,
    error: logError,
    fetchLogs,
  } = usePaginatedInventoryActivityLogs();
  
  const {
    items: batchOptions,
    loading: batchLoading,
    error: batchError,
    hasMore,
    pagination: batchPagination,
    fetchLookup: fetchBatchRegistryLookup,
    resetLookup: restBatchRegistryLookup,
  } = useBatchRegistryLookup();
  
  const {
    items: warehouseOptions,
    loading: warehouseLoading,
    error: warehouseError,
    fetchLookup: fetchWarehouseLookup,
  } = useWarehouseLookup();
  
  const mergedData: MergedInventoryActivityLogEntry[] = useMemo(
    () => mergeInventoryActivityLogs(logData),
    [logData]
  );
  
  const queryParams = useMemo(() => ({
    page,
    limit,
    ...filters,
  }), [page, limit, filters]);
  
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const handleExpandToggle = useCallback((row: InventoryActivityLogEntry) => {
    setExpandedRowId((prevId) => (prevId === row.id ? null : row.id));
  }, []);
  
  const isRowExpanded = useCallback(
    (row: InventoryActivityLogEntry) => row.id === expandedRowId,
    [expandedRowId]
  );
  
  // Fetch on mount or when page/limit changes
  useEffect(() => {
    fetchLogs(queryParams); // server expects 1-based page
  }, [queryParams, fetchLogs]);
  
  useEffect(() => {
    fetchBatchRegistryLookup(batchLookupParams);
  }, [batchLookupParams, fetchBatchRegistryLookup]);
  
  useEffect(() => {
    return () => {
      restBatchRegistryLookup(); // reset only on unmounting
    };
  }, [restBatchRegistryLookup]);
  
  useEffect(() => {
    fetchWarehouseLookup();
  }, [fetchWarehouseLookup]);
  
  const batchLookupOptions = useMemo(() => {
    return mapBatchLookupToOptions(batchOptions, false) as BatchLookupOption[];
  }, [batchOptions]);
  
  const transformWarehouseLookupToOptions = (
    items: WarehouseLookupItem[]
  ): WarehouseOption[] => {
    return items.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  };
  
  const warehouseLookupOptions = useMemo(() => {
    return transformWarehouseLookupToOptions(warehouseOptions);
  }, [warehouseOptions]);
  
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage + 1); // Convert MUI's 0-based to 1-based
  }, []);
  
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // reset page
  }, []);
  
  const handleFetchMoreBatches = () => {
    if (!hasMore || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    
    setBatchLookupParams((prev) => {
      const offset = prev.offset ?? 0;
      const limit = prev.limit ?? 50;
      
      return {
        ...prev,
        offset: offset + limit,
        limit,
      };
    });
    
    setTimeout(() => {
      isFetchingRef.current = false;
    }, 500);
  };
  
  if (logLoading) return <Loading message="Loading activity logs..." />;
  if (logError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={logError} />
      </ErrorDisplay>
    );
  
  return (
    <>
      {Array.isArray(logData) && logData.length > 0 ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            boxShadow: 1,
          }}
        >
          {/* Section Header */}
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <CustomTypography variant="h6">
              Inventory Activity Logs
            </CustomTypography>
            
            <CustomButton variant="outlined" onClick={() => fetchLogs(queryParams)}>
              Refresh Logs
            </CustomButton>
          </Box>
          
          {/* Filter Panel */}
          <Box sx={{ mb: 2 }}>
            <InventoryActivityLogFilterPanel
              filters={stagedFilters}
              onChange={setStagedFilters}
              onApply={() => {
                setFilters(stagedFilters);
                setPage(1); // reset to page 1
              }}
              onReset={() => {
                setStagedFilters({});
                setFilters({});
                setSelectedBatches([]);
                setPage(1);
              }}
              batchLookupOptions={batchLookupOptions}
              selectedBatches={selectedBatches}
              onSelectedBatchesChange={setSelectedBatches}
              batchLookupParams={batchLookupParams}
              setBatchLookupParams={setBatchLookupParams}
              fetchBatchLookup={fetchBatchRegistryLookup}
              hasMore={hasMore}
              pagination={{
                limit: batchPagination.limit,
                offset: batchPagination.offset,
                onFetchMore: handleFetchMoreBatches,
              }}
              batchLookupLoading={batchLoading}
              batchLookupError={batchError}
              warehouseOptions={warehouseLookupOptions}
              selectedWarehouses={selectedWarehouses}
              onSelectedWarehousesChange={setSelectedWarehouses}
              warehouseLoading={warehouseLoading}
              warehouseError={warehouseError}
            />
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Table */}
          <Suspense fallback={<Loading message="Loading table..." />}>
            <InventoryActivityLogsTable
              data={mergedData}
              loading={logLoading}
              page={page - 1}
              totalPages={pagination?.totalPages ?? 1}
              totalRecords={pagination?.totalRecords ?? 0}
              rowsPerPage={limit}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onExpandToggle={handleExpandToggle}
              isRowExpanded={isRowExpanded}
              expandedRowId={expandedRowId}
            />
          </Suspense>
        </Box>
      ) : logLoading ? null : (
        <NoDataFound message="No inventory activity logs available." />
      )}
    </>
  );
};

export default InventoryActivityLogsPage;
