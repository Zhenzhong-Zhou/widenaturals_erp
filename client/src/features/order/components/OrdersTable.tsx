import { FC, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useOrders } from '../../../hooks';
import { Column } from '@components/common/CustomTable.tsx';
import { Order } from '../state/orderTypes.ts';
import { CustomTable, ErrorMessage, Loading } from '@components/index.ts';
import Box from '@mui/material/Box';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useThemeContext } from '../../../context/ThemeContext.tsx';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { getOrderTypeSlug } from '@utils/slugUtils.ts';


const OrdersTable: FC = () => {
  const { theme } = useThemeContext();
  const {
    orders,
    loading,
    error,
    pagination,
    fetchAllOrders
  } = useOrders();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    fetchAllOrders({
      page: page + 1,
      limit: rowsPerPage,
      sortBy: 'created_at',
      sortOrder: 'DESC',
      verifyOrderNumbers: true
    });
  }, [fetchAllOrders, page, rowsPerPage]);
  
  const columns: Column<Order>[] = [
    {
      id: 'order_number',
      label: 'Order Number',
      minWidth: 150,
      sortable: true,
      renderCell: (row: Order) => {
        const orderTypeSlug = getOrderTypeSlug(row.order_type);
        
        // Define colors based on theme mode
        const hoverColor = theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main;
        const bgColor = theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.1)' : 'rgba(25, 118, 210, 0.05)';
        const hoverBgColor = theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.2)' : 'rgba(25, 118, 210, 0.15)';
        
        return (
          <Box
            component={RouterLink}
            to={`/orders/${orderTypeSlug}/${row.id}`}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: bgColor,  // Subtle highlight based on mode
              transition: 'color 0.3s, background-color 0.3s, transform 0.2s',
              '&:hover': {
                color: hoverColor,
                backgroundColor: hoverBgColor,
                transform: 'scale(1.02)',
              }
            }}
          >
            {row.order_number}
          </Box>
        );
      }
    },
    {
      id: 'order_type',
      label: 'Order Type',
      minWidth: 100,
      sortable: true
    },
    {
      id: 'order_date',
      label: 'Order Date',
      minWidth: 150,
      sortable: true,
      format: (value: string | boolean) =>
        typeof value === 'string' ? formatDate(value) : ''
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true
    },
    {
      id: 'note',
      label: 'Note',
      minWidth: 200
    },
    {
      id: 'created_at',
      label: 'Created at',
      minWidth: 120,
      sortable: true,
      format: (value: string | boolean) =>
        typeof value === 'string' ? formatDate(value) : ''
    },
    {
      id: 'created_by',
      label: 'Created By',
      minWidth: 120,
      sortable: true
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      minWidth: 120,
      sortable: true,
      format: (value: string | boolean) =>
        typeof value === 'string' ? formatDate(value) : ''
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      minWidth: 120,
      sortable: true
    },
    {
      id: 'order_number_valid',
      label: 'Integrity',
      minWidth: 80,
      align: 'center',
      sortable: true,
      renderCell: (row: Order) => {
        const iconColor = theme.palette.mode === 'dark' ? '#00FF00' : '#008000';
        const iconErrorColor = theme.palette.mode === 'dark' ? '#FF4444' : '#FF0000';
        
        return row.order_number_valid ? (
          <FontAwesomeIcon icon={faCheckCircle} color={iconColor} />
        ) : (
          <FontAwesomeIcon icon={faTimesCircle} color={iconErrorColor} />
        );
      }
    },
  ];
  
  if (loading) return <Loading message={'Loading All Orders...'}/>;
  if (error) return <ErrorMessage message={error}/>;
  
  return (
    <CustomTable
      columns={columns}
      data={orders}
      page={page}
      rowsPerPageOptions={[5, 10, 25]}
      initialRowsPerPage={rowsPerPage}
      totalPages={pagination.totalPages}
      totalRecords={pagination.totalRecords}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
    />
  );
};

export default OrdersTable;
