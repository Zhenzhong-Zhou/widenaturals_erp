import { type FC, useState } from 'react';
import useAllocationEligibleOrders from '@hooks/useAllocationEligibleOrders.ts';
import GenericOrdersTable from '@features/order/components/GenericOrdersTable';

interface AllocationEligibleOrdersTableProps {
  refreshTrigger?: boolean;
}

/**
 * Component to display orders eligible for inventory allocation.
 * Supports pagination, sorting, and manual refresh.
 */
const AllocationEligibleOrdersTable: FC<AllocationEligibleOrdersTableProps> = ({
  refreshTrigger,
}) => {
  const {
    orders,
    loading,
    error,
    pagination,
    fetchOrders: fetchAllocationEligibleOrders,
    manualRefresh,
    refreshCounter,
  } = useAllocationEligibleOrders();

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
      fetchOrders={fetchAllocationEligibleOrders}
      refreshCounter={refreshCounter}
      isRefreshing={isRefreshing}
      onManualRefresh={handleManualRefresh}
      title="Allocation-Eligible Orders"
      refreshTrigger={refreshTrigger}
    />
  );
};

export default AllocationEligibleOrdersTable;
