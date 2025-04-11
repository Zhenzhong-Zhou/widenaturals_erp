import { type FC, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import CustomTable, { type Column } from '@components/common/CustomTable';
import type { Order } from '@features/order';
import Box from '@mui/material/Box';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import { useThemeContext } from '@context/ThemeContext';
import { formatDate } from '@utils/dateTimeUtils';
import { getOrderTypeSlug } from '@utils/slugUtils';
import useOrders from '@hooks/useOrders';

interface OrdersTableProps {
  refreshTrigger: boolean;
}

const OrdersTable: FC<OrdersTableProps> = ({ refreshTrigger }) => {
  const { theme } = useThemeContext();
  const {
    orders,
    loading,
    error,
    pagination,
    fetchAllOrders,
    manualRefresh,
    refreshCounter,
  } = useOrders();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Define the available options
  const rowsPerPageOptions = [10, 25, 50, 75];

  // Ensure the rowsPerPage value is valid
  const validRowsPerPage = rowsPerPageOptions.includes(rowsPerPage)
    ? rowsPerPage
    : 10;

  useEffect(() => {
    fetchAllOrders({
      page: page + 1,
      limit: rowsPerPage,
      sortBy: 'created_at',
      sortOrder: 'DESC',
      verifyOrderNumbers: true,
    });
  }, [fetchAllOrders, page, rowsPerPage, refreshTrigger, refreshCounter]);

  const columns: Column<Order>[] = [
    {
      id: 'order_number',
      label: 'Order Number',
      minWidth: 150,
      sortable: true,
      renderCell: (row: Order) => {
        const orderTypeSlug = getOrderTypeSlug(row.order_type);

        // Define colors based on theme mode
        const hoverColor =
          theme.palette.mode === 'dark'
            ? theme.palette.primary.light
            : theme.palette.primary.main;
        const bgColor =
          theme.palette.mode === 'dark'
            ? 'rgba(144, 202, 249, 0.1)'
            : 'rgba(25, 118, 210, 0.05)';
        const hoverBgColor =
          theme.palette.mode === 'dark'
            ? 'rgba(144, 202, 249, 0.2)'
            : 'rgba(25, 118, 210, 0.15)';

        return (
          <Box
            component={RouterLink}
            to={`/orders/${orderTypeSlug}/${row.id}`}
            state={{ orderNumber: row.order_number }}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: bgColor, // Subtle highlight based on mode
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
      format: (value: string | boolean) =>
        typeof value === 'string' ? formatDate(value) : '',
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
      format: (value: string | boolean) =>
        typeof value === 'string' ? formatDate(value) : '',
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
      format: (value: string | boolean) =>
        typeof value === 'string' ? formatDate(value) : '',
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
      renderCell: (row: Order) => {
        const iconColor = theme.palette.mode === 'dark' ? '#00FF00' : '#008000';
        const iconErrorColor =
          theme.palette.mode === 'dark' ? '#FF4444' : '#FF0000';

        return row.order_number_valid ? (
          <FontAwesomeIcon icon={faCheckCircle} color={iconColor} />
        ) : (
          <FontAwesomeIcon icon={faTimesCircle} color={iconErrorColor} />
        );
      },
    },
  ];

  // Handle manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      manualRefresh(); // Trigger re-fetch via the hook
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) return <Loading message={'Loading All Orders...'} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 2,
        }}
      >
        <CustomButton onClick={handleManualRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Table'}
        </CustomButton>
      </Box>

      <CustomTable
        columns={columns}
        data={orders}
        page={page}
        rowsPerPageOptions={[10, 25, 50, 75]}
        initialRowsPerPage={validRowsPerPage}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </Box>
  );
};

export default OrdersTable;
