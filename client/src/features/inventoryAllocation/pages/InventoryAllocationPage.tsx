import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { CustomTypography, Loading, NoDataFound } from '@components/index';
import InventoryAllocationTable, {
  InventoryAllocationFiltersPanel,
  InventoryAllocationSortControls,
} from '@features/inventoryAllocation/components/InventoryAllocationTable';
import { usePaginatedInventoryAllocations } from '@hooks/index';
import type {
  InventoryAllocationFilters,
  InventoryAllocationQueryParams,
  InventoryAllocationSortField,
} from '@features/inventoryAllocation/state';

const InventoryAllocationPage: FC = () => {
  const [sortBy, setSortBy] =
    useState<InventoryAllocationSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<InventoryAllocationFilters>({});
  
  const {
    data: inventoryAllocations,
    loading: allocationsLoading,
    error: allocationsError,
    isEmpty: isInventoryAllocationEmpty,
    totalRecords: totalAllocationRecords,
    pagination: allocationPagination,
    pageInfo: allocationPageInfo,
    resetAllocations: resetInventoryAllocations,
    fetchAllocations: fetchInventoryAllocations,
  } = usePaginatedInventoryAllocations();
  
  const queryParams = useMemo<InventoryAllocationQueryParams>(
    () => ({
      page: allocationPageInfo.page,
      limit: allocationPageInfo.limit,
      sortBy,
      sortOrder,
      filters,
    }),
    [allocationPageInfo.page, allocationPageInfo.limit, sortBy, sortOrder, filters]
  );
  
  useEffect(() => {
    fetchInventoryAllocations(queryParams);
    
    return () => {
      resetInventoryAllocations();
    };
  }, [queryParams, fetchInventoryAllocations, resetInventoryAllocations]);
  
  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchInventoryAllocations({ ...queryParams, page: newPage + 1 });
    },
    [queryParams, fetchInventoryAllocations]
  );
  
  const handleRowsPerPageChange = useCallback(
    (newLimit: number) => {
      fetchInventoryAllocations({ ...queryParams, page: 1, limit: newLimit });
    },
    [queryParams, fetchInventoryAllocations]
  );
  
  const handleRefresh = useCallback(() => {
    fetchInventoryAllocations(queryParams);
  }, [queryParams, fetchInventoryAllocations]);
  
  const handleResetFilters = useCallback(() => {
    resetInventoryAllocations();
    setFilters({});
  }, [resetInventoryAllocations]);

  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <CustomTypography variant="h5" fontWeight={700}>
          Inventory Allocation Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <InventoryAllocationFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => fetchInventoryAllocations({ ...queryParams, page: 1 })}
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
          <Loading
            variant="dotted"
            message="Loading inventory allocations..."
          />
        ) : allocationsError ? (
          <CustomTypography color="error">{allocationsError}</CustomTypography>
        ) : isInventoryAllocationEmpty ? (
          <NoDataFound message="No inventory allocations found." />
        ) : (
          <InventoryAllocationTable
            data={inventoryAllocations}
            page={allocationPageInfo.page - 1}
            rowsPerPage={allocationPageInfo.limit}
            totalRecords={totalAllocationRecords}
            totalPages={allocationPagination?.totalPages ?? 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onRefresh={handleRefresh}
          />
        )}
      </Box>
    </Box>
  );
};

export default InventoryAllocationPage;
