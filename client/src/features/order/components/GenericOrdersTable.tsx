import { type FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTable, { type Column } from '@components/common/CustomTable';
import CustomButton from '@components/common/CustomButton';
import { formatDate } from '@utils/dateTimeUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useThemeContext } from '@context/ThemeContext';
import { type Order, type FetchOrdersParams } from '@features/order';
import { Link as RouterLink } from 'react-router-dom';
import CustomTypography from '@components/common/CustomTypography';
import { getOrderRoutePath } from '@utils/navigationUtils';

interface GenericOrdersTableProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
  fetchOrders: (params: FetchOrdersParams) => void;
  refreshCounter: number;
  defaultSortBy?: keyof Order;
  title?: string;
  refreshTrigger?: boolean;
  isRefreshing?: boolean;
  onManualRefresh?: () => void;
}

const GenericOrdersTable: FC<GenericOrdersTableProps> = ({
                                                           orders,
                                                           loading,
                                                           error,
                                                           pagination,
                                                           fetchOrders,
                                                           refreshCounter,
                                                           defaultSortBy = 'created_at',
                                                           title = 'Orders Table',
                                                           refreshTrigger = false,
                                                           isRefreshing = false,
                                                           onManualRefresh,
                                                         }) => {
  const { theme } = useThemeContext();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const rowsPerPageOptions = [10, 25, 50, 75];
  const validRowsPerPage = rowsPerPageOptions.includes(rowsPerPage) ? rowsPerPage : 10;
  
  useEffect(() => {
    fetchOrders({
      page: page + 1,
      limit: rowsPerPage,
      sortBy: defaultSortBy,
      sortOrder: 'DESC',
      verifyOrderNumbers: true,
    });
  }, [fetchOrders, page, rowsPerPage, refreshTrigger, refreshCounter]);
  
  const columns: Column<Order>[] = [
    {
      id: 'order_number',
      label: 'Order Number',
      minWidth: 150,
      sortable: true,
      renderCell: (row: Order) => {
        const orderLink = getOrderRoutePath(row);
        const hoverColor = theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main;
        const bgColor = theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.1)' : 'rgba(25, 118, 210, 0.05)';
        const hoverBgColor = theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.2)' : 'rgba(25, 118, 210, 0.15)';
        
        return (
          <Box
            component={RouterLink}
            to={orderLink}
            state={{ orderNumber: row.order_number }}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: bgColor,
              transition: 'color 0.3s, background-color 0.3s, transform 0.2s',
              '&:hover': {
                color: hoverColor,
                backgroundColor: hoverBgColor,
                transform: 'scale(1.02)',
              },
            }}
          >
            {row.order_number}
          </Box>
        );
      },
    },
    {
      id: 'order_type',
      label: 'Order Type',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'order_date',
      label: 'Order Date',
      minWidth: 150,
      sortable: true,
      format: (value) => (typeof value === 'string' ? formatDate(value) : ''),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'note',
      label: 'Note',
      minWidth: 200,
    },
    {
      id: 'created_at',
      label: 'Created at',
      minWidth: 120,
      sortable: true,
      format: (value) => (typeof value === 'string' ? formatDate(value) : ''),
    },
    {
      id: 'created_by',
      label: 'Created By',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      minWidth: 120,
      sortable: true,
      format: (value) => (typeof value === 'string' ? formatDate(value) : ''),
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'order_number_valid',
      label: 'Integrity',
      minWidth: 80,
      align: 'center',
      sortable: true,
      renderCell: (row) => {
        const iconColor = theme.palette.mode === 'dark' ? '#00FF00' : '#008000';
        const iconErrorColor = theme.palette.mode === 'dark' ? '#FF4444' : '#FF0000';
        return row.order_number_valid ? (
          <FontAwesomeIcon icon={faCheckCircle} color={iconColor} />
        ) : (
          <FontAwesomeIcon icon={faTimesCircle} color={iconErrorColor} />
        );
      },
    },
  ];
  
  if (loading) return <Loading message={`Loading ${title}...`} />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <CustomTypography>
          {title}
        </CustomTypography>
        <CustomButton onClick={onManualRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Table'}
        </CustomButton>
      </Box>
      
      <CustomTable
        columns={columns}
        data={orders}
        page={page}
        rowsPerPageOptions={rowsPerPageOptions}
        initialRowsPerPage={validRowsPerPage}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        emptyMessage={`${title} No orders found.`}
      />
    </Box>
  );
};

export default GenericOrdersTable;
