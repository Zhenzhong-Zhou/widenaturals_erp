import { type FC, useState } from 'react';
import useAllOrders from '@hooks/useAllOrders';
import GenericOrdersTable from '@features/order/components/GenericOrdersTable';

interface OrdersTableProps {
  refreshTrigger: boolean;
}

const AllOrdersTable: FC<OrdersTableProps> = ({ refreshTrigger }) => {
  const {
    orders,
    loading,
    error,
    pagination,
    fetchOrders: fetchAllOrders,
    manualRefresh,
    refreshCounter,
  } = useAllOrders();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      manualRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <GenericOrdersTable
      orders={orders}
      loading={loading}
      error={error}
      pagination={pagination}
      fetchOrders={fetchAllOrders}
      refreshCounter={refreshCounter}
      isRefreshing={isRefreshing}
      onManualRefresh={handleManualRefresh}
      title="All Orders"
      refreshTrigger={refreshTrigger}
    />
  );
};

export default AllOrdersTable;
