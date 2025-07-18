import { type FC } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable, { type Column } from '@components/common/CustomTable';
import CustomButton from '@components/common/CustomButton';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import type { CustomerListItem } from '@features/customer/state';

interface CustomerTableProps {
  data: CustomerListItem[];
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
}

const CustomerTable: FC<CustomerTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalPages,
  totalRecords,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
}) => {
  const columns: Column<CustomerListItem>[] = [
    {
      id: 'customerName',
      label: 'Customer Name',
      sortable: true,
      renderCell: (row) => (
        <Link
          to={`/customers/customer/${row.id}`}
          style={{
            textDecoration: 'none',
            color: '#1976D2',
            fontWeight: 'bold',
          }}
        >
          {row.customerName}
        </Link>
      ),
    },
    { id: 'email', label: 'Email', sortable: true },
    {
      id: 'phoneNumber',
      label: 'Phone',
      sortable: true,
      format: (value) =>
        typeof value === 'string' ? formatPhoneNumber(value) : 'Unknown',
    },
    {
      id: 'statusName',
      label: 'Status',
      sortable: false,
      format: (value) =>
        typeof value === 'string' ? formatLabel(value) : 'Unknown',
    },
    {
      id: 'hasAddress',
      label: 'Has Address',
      sortable: true,
      renderCell: (row) =>
        row.hasAddress ? (
          <CheckCircleIcon color="success" fontSize="small" />
        ) : (
          <CancelIcon color="disabled" fontSize="small" />
        ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      format: (value) => (typeof value === 'string' ? formatDate(value) : '-'),
    },
    {
      id: 'createdBy',
      label: 'Created By',
      sortable: true,
    },
    {
      id: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (value) => (typeof value === 'string' ? formatDate(value) : '-'),
    },
    { id: 'updatedBy', label: 'Updated By', sortable: true },
  ];

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Customer List
        </CustomTypography>

        <CustomButton
          onClick={onRefresh}
          variant="outlined"
          sx={{ color: 'primary', fontWeight: 500 }}
        >
          Refresh
        </CustomButton>
      </Box>

      <CustomTable
        columns={columns}
        data={data}
        page={page}
        initialRowsPerPage={rowsPerPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        rowsPerPageOptions={[25, 50, 75, 100]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        emptyMessage="No customers found."
      />
    </Box>
  );
};

export default CustomerTable;
