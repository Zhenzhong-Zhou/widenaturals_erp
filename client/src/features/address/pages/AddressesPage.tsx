import { type FC, type MouseEvent, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
// import AddressCreateDialog from '@features/address/components/AddressCreateDialog';
import AddressesTable from '@features/address/components/AddressesTable';
import NoDataFound from '@components/common/NoDataFound';
import Loading from '@components/common/Loading';
// import AddressFiltersPanel from '@features/address/components/AddressFiltersPanel';
// import AddressSortControls from '@features/address/components/AddressSortControls';
import usePaginateAddresses from '@hooks/usePaginateAddresses';
import type { AddressFilterConditions, AddressSortField } from '../state';
import { useDialogFocusHandlers } from '@utils/hooks/useDialogFocusHandlers';
import { usePaginationHandlers } from '@utils/hooks/usePaginationHandlers';
import type { SortOrder } from '@shared-types/api';

const AddressesPage: FC = () => {
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<AddressSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('');
  const [filters, setFilters] = useState<AddressFilterConditions>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);  // NEW: Track expanded row
  
  const { handleOpenDialog, handleCloseDialog } = useDialogFocusHandlers(
    setDialogOpen,
    createButtonRef,
    () => dialogOpen
  );
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(setPage, setLimit);
  
  const {
    data: addresses,
    pagination: addressPagination,
    loading: addressLoading,
    error,
    fetchAddresses,
  } = usePaginateAddresses();
  
  useEffect(() => {
    fetchAddresses({
      page,
      limit,
      // sortBy,
      // sortOrder,
      // ...filters,
    });
  }, [page, limit, sortBy, sortOrder, filters]);
  
  const handleRefresh = () => {
    fetchAddresses({ page, limit, sortBy, sortOrder, ...filters });
  };
  
  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };
  
  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={3} gap={2}>
        <CustomTypography variant="h5" fontWeight={700}>
          Address Management
        </CustomTypography>
        <CustomButton
          ref={createButtonRef}
          variant="contained"
          onClick={handleOpenDialog}
          sx={{ boxShadow: 2 }}
        >
          Create Address
        </CustomButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        {/* Filters & sort controls can go here */}
      </Card>
      
      {/*<AddressCreateDialog open={dialogOpen} onClose={handleCloseDialog} onCreated={handleRefresh} />*/}
      
      <Box>
        {addressLoading ? (
          <Loading variant="dotted" message="Loading addresses..." />
        ) : error ? (
          <CustomTypography color="error">{error}</CustomTypography>
        ) : addresses.length === 0 ? (
          <NoDataFound message="No addresses found." />
        ) : (
          <AddressesTable
            loading={addressLoading}
            data={addresses}
            page={page - 1}
            rowsPerPage={limit}
            totalRecords={addressPagination?.totalRecords || 0}
            totalPages={addressPagination?.totalPages || 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            expandedRowId={expandedRowId}
            onDrillDownToggle={handleDrillDownToggle}
            onRefresh={handleRefresh}
          />
        )}
      </Box>
    </Box>
  );
};

export default AddressesPage;
