import { FC, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useCustomers } from "../../../hooks";
import { CustomButton, CustomTable } from '@components/index.ts';
import { Customer } from "../state/customerTypes";
import { capitalizeFirstLetter, formatPhoneNumber } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { Link } from 'react-router-dom';

const CustomerTable: FC = () => {
  const { allCustomers, pagination, loading, error, fetchCustomers, refreshCustomers } = useCustomers();
  
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
  const columns = [
    {
      id: "customer_name",
      label: "Customer Name",
      sortable: true,
      renderCell: (row: Customer) => (
        <Link
          to={`/customers/customer/${row.id}`} // Navigate to customer detail page
          style={{ textDecoration: "none", color: "#1976D2", fontWeight: "bold" }}
        >
          {row.customer_name}
        </Link>
      ),
    },
    {
      id: "email",
      label: "Email",
      sortable: true
    },
    {
      id: "phone_number",
      label: "Phone",
      sortable: true,
      format: (value: string) => formatPhoneNumber(value),
    },
    {
      id: "status_name",
      label: "Status",
      sortable: false,
      format: (value: string) => capitalizeFirstLetter(value),
    },
    {
      id: "created_at",
      label: "Created At",
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: "created_by",
      label: "Created By",
      sortable: true,
    },
    {
      id: "updated_at",
      label: "Updated At",
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: "updated_by",
      label: "Updated By",
      sortable: true,
    },
  ];
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customer List
      </Typography>
      
      <CustomButton variant="contained" onClick={refreshCustomers} sx={{ mb: 2 }}>
        Refresh Data
      </CustomButton>
      
      {loading && <Typography>Loading customers...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      
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
