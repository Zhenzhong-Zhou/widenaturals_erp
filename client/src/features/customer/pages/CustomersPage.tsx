import { type FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
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
      {/* Header Section */}
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
        
        <Box display="flex" gap={2}>
          <CustomButton
            variant="contained"
            onClick={() => setDialogOpen(true)}
            sx={{ boxShadow: 2 }}
          >
            Create Customer
          </CustomButton>
        </Box>
      </Box>
      
      <Divider sx={{ mt: 2, mb: 4}}/>
      
      {/* Dialog */}
      <CustomerCreateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      
      {/* Filter Panel */}
      <CustomerFiltersPanel
        filters={filters}
        onChange={setFilters}
        onApply={() => setPage(1)} // Trigger re-fetch via useEffect
        onReset={handleResetFilters}
      />
      
      <CustomerSortControls
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />
      
      {/* Main Content */}
      {loading ? (
        <Loading variant="dotted" message="Loading customers..." />
      ) : error ? (
        <CustomTypography color="error">{error}</CustomTypography>
      ) : customers.length === 0 ? (
        <NoDataFound message="No customers found." />
      ) : (
        <CustomerTable
          data={customers}
          onRefresh={handleRefresh}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </Box>
  );
};

export default CustomersPage;
