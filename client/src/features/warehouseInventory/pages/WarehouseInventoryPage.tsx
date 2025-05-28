import { lazy, Suspense, type SyntheticEvent, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import useWarehouseInventory from '@hooks/useWarehouseInventory';
import type { SortConfig } from '@shared-types/api';
import type {
  FlatWarehouseInventoryRow,
  WarehouseInventoryQueryParams,
  WarehouseInventoryRecord,
} from '@features/warehouseInventory/state';
import { groupBy } from 'lodash';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType.ts';
import WarehouseInventoryExpandedRow from '@features/warehouseInventory/components/WarehouseInventoryExpandedRow.tsx';
import Stack from '@mui/material/Stack';

const WarehouseInventoryTable = lazy(() => import('@features/warehouseInventory/components/WarehouseInventoryTable'));

const WarehouseInventoryPage = () => {
  const [itemTypeTab, setItemTypeTab] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: '', sortOrder: '' });
  const [filters, setFilters] = useState<WarehouseInventoryQueryParams>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const {
    records,
    loading,
    error,
    pagination,
    fetchWarehouseInventory,
  } = useWarehouseInventory();
  
  useEffect(() => {
    fetchWarehouseInventory({ page, limit }, filters, sortConfig);
  }, []);
  
  // Convert tab to batchType
  const batchType: ItemType | undefined =
    itemTypeTab === 1 ? 'product' :
      itemTypeTab === 2 ? 'packaging_material' :
        undefined;
  
  const groupedByWarehouse = groupBy(records, (record: WarehouseInventoryRecord) => record.warehouse?.name || 'Unknown Warehouse');
  
  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    setItemTypeTab(newValue);
    const newBatchType: WarehouseInventoryQueryParams['batchType'] =
      newValue === 1 ? 'product' : newValue === 2 ? 'packaging_material' : undefined;
    
    setFilters((prev) => ({
      ...prev,
      batchType: newBatchType,
    }));
    
    setPage(1);
  };
  
  const handleApplyFilters = (newFilters: WarehouseInventoryQueryParams) => {
    setFilters({ ...newFilters, batchType }); // always preserve tab batchType
    setPage(1); // reset to first page
  };
  
  const handleResetFilters = () => {
    setFilters(batchType ? { batchType } : {});
    setPage(1);
  };
  
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage + 1);
  }, []);
  
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // reset to page 1
  }, []);
  
  const handleExpandToggle = (row: FlatWarehouseInventoryRow) => {
    setExpandedRowId(prev => (prev === row.id ? null : row.id));
  };
  
  const isRowExpanded = (row: FlatWarehouseInventoryRow) => expandedRowId === row.id;
  
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <WarehouseIcon fontSize="medium" color="primary" />
        <CustomTypography variant="h5" fontWeight={600}>
          All Warehouse Inventory
        </CustomTypography>
      </Stack>
      
      {/* Warehouse Inventory Table */}
      <Suspense fallback={<Skeleton height={180} width="100%" />} >
        <WarehouseInventoryTable
          isLoading={loading}
          groupedData={groupedByWarehouse}
          page={page - 1}
          rowsPerPage={limit}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onExpandToggle={handleExpandToggle}
          isRowExpanded={isRowExpanded}
          expandedContent={(row) => <WarehouseInventoryExpandedRow record={row.originalRecord} />}
        />
      </Suspense>

      {/* Refresh Button */}
      <CustomButton onClick={() => fetchWarehouseInventory({ page, limit }, filters, sortConfig)} sx={{ marginTop: 2 }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default WarehouseInventoryPage;
