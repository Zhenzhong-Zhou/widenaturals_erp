import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import CustomerCreateDialog from '@features/customer/components/CustomerCreateDialog';
import CustomerTable from '@features/customer/components/CustomerTable';
import NoDataFound from '@components/common/NoDataFound';
import Loading from '@components/common/Loading';
import CustomerFiltersPanel from '@features/customer/components/CustomerFiltersPanel';
import CustomerSortControls from '../components/CustomerSortControls';
import usePaginatedCustomers from '@hooks/usePaginatedCustomers';
import type { CustomerFilters, CustomerSortField } from '@features/customer/state';
import { useDialogFocusHandlers } from '@utils/hooks/useDialogFocusHandlers';
import { usePaginationHandlers } from '@utils/hooks/usePaginationHandlers';
import { applyFiltersAndSorting } from '@utils/queryUtils';

const CustomersPage: FC = () => {
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<CustomerSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<CustomerFilters>({});
  
  const { handleOpenDialog, handleCloseDialog } = useDialogFocusHandlers(
    setDialogOpen,
    createButtonRef,
    () => dialogOpen
  );
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(setPage, setLimit);
  
  const {
    customers,
    totalPages,
    totalRecords,
    loading,
    error,
    fetchCustomers,
  } = usePaginatedCustomers();
  
  // Memoize the query parameters to avoid unnecessary re-renders or function calls
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      fetchFn: fetchCustomers,
    }),
    [page, limit, sortBy, sortOrder, filters, fetchCustomers]
  );

  // Fetch when dependency change
  useEffect(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);

  // Stable refresh handler
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  const handleResetFilters = () => {
    setFilters({});
    setPage(1); // Optional: reset to first page
  };
  
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
          Customer Management
        </CustomTypography>
        
        <CustomButton
          ref={createButtonRef}
          variant="contained"
          onClick={handleOpenDialog}
          sx={{ boxShadow: 2 }}
        >
          Create Customer
        </CustomButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Filter + Sort Controls in Card */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          {/* Filter fields */}
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <CustomerFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          
          {/* Sort Controls */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CustomerSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Dialog */}
      <CustomerCreateDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onCreated={handleRefresh}
      />
      
      {/* Customer Table Section */}
      <Box>
        {loading ? (
          <Loading variant="dotted" message="Loading customers..." />
        ) : error ? (
          <CustomTypography color="error">{error}</CustomTypography>
        ) : customers.length === 0 ? (
          <NoDataFound message="No customers found." />
        ) : (
          <CustomerTable
            data={customers}
            page={page - 1}
            rowsPerPage={limit}
            totalRecords={totalRecords}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onRefresh={handleRefresh}
          />
        )}
      </Box>
    </Box>
  );
};

export default CustomersPage;
