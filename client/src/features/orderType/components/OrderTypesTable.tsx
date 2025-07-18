import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTable, { type Column } from '@components/common/CustomTable';
import CustomButton from '@components/common/CustomButton';
import Tooltip from '@mui/material/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import type { OrderTypeListItem } from '@features/orderType/state';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import CustomTypography from '@components/common/CustomTypography.tsx';

interface OrderTypesTableProps {
  data: OrderTypeListItem[];
  page: number;
  loading: boolean;
  totalRecords: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
}

// Define columns outside to avoid re-creation on every render
const orderTypeColumns: Column<OrderTypeListItem>[] = [
  {
    id: 'name',
    label: 'Order Type',
    minWidth: 170,
    sortable: true,
    format: (value: string | boolean) => formatLabel(String(value)),
  },
  {
    id: 'code',
    label: 'Code',
    minWidth: 150,
    sortable: true,
  },
  {
    id: 'category',
    label: 'Category',
    minWidth: 150,
    sortable: true,
    format: (value: string | boolean) => formatLabel(String(value)),
  },
  {
    id: 'description',
    label: 'Description',
    minWidth: 250,
  },
  {
    id: 'requiresPayment',
    label: 'Requires Payment',
    sortable: true,
    renderCell: (row) => {
      const requiresPayment = row.requiresPayment;
      return (
        <Tooltip title={requiresPayment ? 'Payment required' : 'No payment required'}>
        <span>
          <FontAwesomeIcon
            icon={requiresPayment ? faCheckCircle : faTimesCircle}
            color={requiresPayment ? 'green' : 'gray'}
          />
        </span>
        </Tooltip>
      );
    },
  },
  {
    id: 'statusName',
    label: 'Status',
    minWidth: 100,
    sortable: true,
    format: (value: string | boolean) => formatLabel(String(value)),
  },
  {
    id: 'statusDate',
    label: 'Status Date',
    minWidth: 100,
    sortable: true,
    format: (value: string | boolean) =>
      value && value !== 'Invalid Date'
        ? formatDate(String(value))
        : '—',
  },
  {
    id: 'createdAt',
    label: 'Created At',
    minWidth: 100,
    sortable: true,
    format: (value: string | boolean) =>
      value && value !== 'Invalid Date'
        ? formatDate(String(value))
        : '—',
  },
  {
    id: 'createdBy',
    label: 'Created By',
    minWidth: 150,
    sortable: true,
  },
  {
    id: 'updatedBy',
    label: 'Updated By',
    minWidth: 150,
    sortable: true,
  },
  {
    id: 'updatedAt',
    label: 'Updated At',
    minWidth: 100,
    sortable: true,
    format: (value: string | boolean) =>
      value && value !== 'Invalid Date'
        ? formatDate(String(value))
        : '—',
  },
];

const OrderTypesTable: FC<OrderTypesTableProps> = ({
                                                     data,
                                                     page,
                                                     rowsPerPage,
                                                     totalRecords,
                                                     totalPages,
                                                     loading,
                                                     onPageChange,
                                                     onRowsPerPageChange,
                                                     onRefresh,
                                                   }) => {
  
  return (
   <Box>
     <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
       <CustomTypography variant="h6">Order Type List</CustomTypography>
       <CustomButton onClick={onRefresh} variant="outlined" sx={{ color: 'primary' }}>
         Refresh Data
       </CustomButton>
     </Box>
     
     <CustomTable
       columns={orderTypeColumns}
       data={data}
       page={page}
       initialRowsPerPage={rowsPerPage}
       rowsPerPageOptions={[10, 25, 50]}
       totalRecords={totalRecords}
       totalPages={totalPages}
       onPageChange={onPageChange}
       onRowsPerPageChange={onRowsPerPageChange}
       loading={loading}
       emptyMessage="No order types found."
     />
   </Box>
  );
};

export default OrderTypesTable;
