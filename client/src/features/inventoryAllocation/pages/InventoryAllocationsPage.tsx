import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import NoDataFound from '@components/common/NoDataFound';
import Loading from '@components/common/Loading';
import InventoryAllocationTable, {
  InventoryAllocationFiltersPanel, InventoryAllocationSortControls,
} from '@features/inventoryAllocation/components/InventoryAllocationTable';
import { usePaginatedInventoryAllocations } from '@hooks/usePaginatedInventoryAllocations';
import { usePaginationHandlers } from '@utils/hooks/usePaginationHandlers';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import type {
  InventoryAllocationFilters,
  InventoryAllocationSortField,
} from '@features/inventoryAllocation/state';

const InventoryAllocationsPage: FC = () => {
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<InventoryAllocationSortField>('orderCreatedAt');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<InventoryAllocationFilters>({});
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(setPage, setLimit);
  
  const {
    data: inventoryAllocations,
    loading: allocationsLoading,
    error: allocationsError,
    totalRecords: totalAllocationRecords,
    totalPages: totalAllocationPages,
    reset: resetInventoryAllocations,
    fetch: fetchInventoryAllocations,
  } = usePaginatedInventoryAllocations();
  
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      fetchFn: fetchInventoryAllocations,
    }),
    [page, limit, sortBy, sortOrder, filters, fetchInventoryAllocations]
  );
  
  useEffect(() => {
    applyFiltersAndSorting(queryParams);
    
    return () => {
      resetInventoryAllocations(); // cleanup when component unmounts
    };
  }, [queryParams]);
  
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  const handleResetFilters = () => {
    resetInventoryAllocations();
    setFilters({});
    setPage(1);
  };
  
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={3} gap={2}>
        <CustomTypography variant="h5" fontWeight={700}>
          Inventory Allocation Management
        </CustomTypography>
        
        <CustomButton
          ref={createButtonRef}
          variant="contained"
          onClick={handleRefresh}
          sx={{ boxShadow: 2 }}
        >
          Refresh
        </CustomButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <InventoryAllocationFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <InventoryAllocationSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Allocation Table Section */}
      <Box>
        {allocationsLoading ? (
          <Loading variant="dotted" message="Loading inventory allocations..." />
        ) : allocationsError ? (
          <CustomTypography color="error">{allocationsError}</CustomTypography>
        ) : inventoryAllocations.length === 0 ? (
          <NoDataFound message="No inventory allocations found." />
        ) : (
          <InventoryAllocationTable
            data={inventoryAllocations}
            page={page - 1}
            rowsPerPage={limit}
            totalRecords={totalAllocationRecords}
            totalPages={totalAllocationPages}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onRefresh={handleRefresh}
          />
        )}
      </Box>
    </Box>
  );
};

export default InventoryAllocationsPage;
