import { type FC, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import CustomTable, { type Column } from '@components/common/CustomTable';
import type { Customer } from '@features/customer';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import useCustomers from '@hooks/useCustomers';

const CustomerTable: FC = () => {
  const {
    allCustomers,
    pagination,
    loading,
    error,
    fetchCustomers,
    refreshCustomers,
  } = useCustomers();

  // Table Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCustomers({ page: newPage + 1, limit: rowsPerPage });
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchCustomers({ page: 1, limit: newRowsPerPage });
  };

  // Table column definitions
  const columns: Column<Customer>[] = [
    {
      id: 'customer_name',
      label: 'Customer Name',
      sortable: true,
      renderCell: (row: Customer) => (
        <Link
          to={`/customers/customer/${row.id}`} // Navigate to customer detail page
          style={{
            textDecoration: 'none',
            color: '#1976D2',
            fontWeight: 'bold',
          }}
        >
          {row.customer_name}
        </Link>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      id: 'phone_number',
      label: 'Phone',
      sortable: true,
      format: (value: string | null) => formatPhoneNumber(value)
    },
    {
      id: 'status_name',
      label: 'Status',
      sortable: false,
      format: (value: string | null) => formatLabel(value),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: string | null) => formatDate(value),
    },
    {
      id: 'created_by',
      label: 'Created By',
      sortable: true,
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: string | null) => formatDate(value),
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      sortable: true,
    },
  ];

  return (
    <Box>
      <CustomTypography
        sx={{
          fontWeight: 600,
          lineHeight: 1.3,
          minHeight: '1.25rem',
        }}
      >
        Customer List
      </CustomTypography>

      <CustomButton
        variant="contained"
        onClick={refreshCustomers}
        sx={{ mb: 2 }}
      >
        Refresh Data
      </CustomButton>

      {loading && <CustomTypography>Loading customers...</CustomTypography>}
      {error && <CustomTypography color="error">{error}</CustomTypography>}

      <CustomTable
        columns={columns}
        data={allCustomers as Customer[]}
        rowsPerPageOptions={[10, 25, 50, 75]}
        initialRowsPerPage={rowsPerPage}
        totalPages={pagination?.totalPages || 1}
        totalRecords={pagination?.totalRecords || 0}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Box>
  );
};

export default CustomerTable;
