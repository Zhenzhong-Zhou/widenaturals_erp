import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import {
  faMapMarkerAlt,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import AddressCreateDialog from '@features/address/components/AddressCreateDialog';
import AddressesTable from '@features/address/components/AddressesTable';
import NoDataFound from '@components/common/NoDataFound';
import Loading from '@components/common/Loading';
import AddressFiltersPanel from '@features/address/components/AddressFiltersPanel';
import AddressSortControls from '@features/address/components/AddressSortControls';
import usePaginateAddresses from '@hooks/usePaginateAddresses';
import type { AddressFilterConditions, AddressSortField } from '../state';
import { useDialogFocusHandlers } from '@utils/hooks/useDialogFocusHandlers';
import { usePaginationHandlers } from '@utils/hooks/usePaginationHandlers';
import type { SortOrder } from '@shared-types/api';
import useCustomerLookup from '@hooks/useCustomerLookup';
import type { CustomerLookupQuery } from '@features/lookup/state';
import { applyFiltersAndSorting } from '@utils/queryUtils';

const AddressesPage: FC = () => {
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<AddressSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('');
  const [filters, setFilters] = useState<AddressFilterConditions>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [fetchParams, setFetchParams] = useState<CustomerLookupQuery>({
    keyword: '',
    offset: 0,
    limit: 10,
  });
  
  const { handleOpenDialog, handleCloseDialog } = useDialogFocusHandlers(
    setDialogOpen,
    createButtonRef,
    () => dialogOpen
  );
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );
  
  const {
    data: addresses,
    pagination: addressPagination,
    loading: addressLoading,
    error,
    fetchAddresses,
  } = usePaginateAddresses();
  
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      fetchFn: fetchAddresses,
    }),
    [page, limit, sortBy, sortOrder, filters, fetchAddresses]
  );
  
  useEffect(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  const {
    loading: customerLookupLoading,
    error: customerLookupError,
    options: customerDropdownOptions,
    meta: customerLookupPaginationMeta,
    fetchLookup: fetchCustomerDropdownOptions,
  } = useCustomerLookup(fetchParams);

  const deduplicatedOptions = useMemo(() => {
    return Array.from(
      new Map(
        customerDropdownOptions.map((opt) => {
          const hasAddr = opt.hasAddress ?? false;
          
          return [
            opt.value,
            {
              ...opt,
              icon: hasAddr ? faMapMarkerAlt : faQuestionCircle,
              tooltip: hasAddr ? 'Has Address' : 'No Address',
              iconColor: hasAddr ? 'green' : 'gray',
            },
          ];
        })
      ).values()
    );
  }, [customerDropdownOptions]);
  
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  const handleResetFilters = () => {
    setFilters({});
    setSortBy('createdAt');
    setSortOrder('');
    setPage(1);
  };
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };
  
  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
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
        <Grid container spacing={2}>
          {/* Filter fields */}
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <AddressFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
              customerDropdownOptions={deduplicatedOptions}
              fetchCustomerDropdownOptions={fetchCustomerDropdownOptions}
              customerLookupLoading={customerLookupLoading}
              customerLookupError={customerLookupError}
              customerLookupMeta={customerLookupPaginationMeta}
              fetchParams={fetchParams}
              setFetchParams={setFetchParams}
            />
          </Grid>

          {/* Sort Controls */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AddressSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      <AddressCreateDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleRefresh}
        customerDropdownOptions={deduplicatedOptions}
        fetchCustomerDropdownOptions={fetchCustomerDropdownOptions}
        customerLookupLoading={customerLookupLoading}
        customerLookupError={customerLookupError}
        customerLookupMeta={customerLookupPaginationMeta}
      />

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
