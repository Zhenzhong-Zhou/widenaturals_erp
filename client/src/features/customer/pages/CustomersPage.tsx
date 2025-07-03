import { type FC, type MouseEvent, useEffect, useRef, useState } from 'react';
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

const CustomersPage: FC = () => {
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<CustomerSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<CustomerFilters>({});
  
  const {
    customers,
    totalPages,
    totalRecords,
    loading,
    error,
    fetchCustomers,
  } = usePaginatedCustomers();
  
  // Fetch when dependency change
  useEffect(() => {
    fetchCustomers({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });
  }, [page, limit, sortBy, sortOrder, filters]);
  
  // Open handler
  const handleOpenDialog = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();          // remove focus right before opening
    requestAnimationFrame(() => {
      setDialogOpen(true);          // open on next tick to avoid race
    });
  };

  // Dialog close handler
  const handleCloseDialog = () => {
    setDialogOpen(false);
    
    // Delay more than dialog transition to ensure aria-hidden is gone
    setTimeout(() => {
      // Only restore focus if the dialog is definitely closed
      if (!dialogOpen) {
        createButtonRef.current?.focus();
      }
    }, 300); // Increase from 200 to 300+
  };
  
  const handleRefresh = () => {
    fetchCustomers({ page, limit, sortBy, sortOrder, filters });
  };
  
  const handleResetFilters = () => {
    setFilters({});
    setPage(1); // Optional: reset to first page
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1); // Backend is 1-based
  };
  
  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page on limit change
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
