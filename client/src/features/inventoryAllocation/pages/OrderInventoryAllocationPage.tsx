import { type FC, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import GoBackButton from '@components/common/GoBackButton';
import Loading from '@components/common/Loading';
import useAllocationEligibleOrderDetails from '@hooks/useAllocationEligibleOrderDetails';
import InventoryAllocationDetailsTable
  from '@features/inventoryAllocation/components/InventoryAllocationDetailsTable';
import { getStatusColor } from '@utils/statusColorUtils';
import { useThemeContext } from '@context/ThemeContext';
import CustomButton from '@components/common/CustomButton';
import useProductsWarehouseDropdown from '@hooks/useProductsWarehouseDropdown';

const OrderInventoryAllocationPage: FC = () => {
  const { orderType, orderId } = useParams<{ orderType: string; orderId: string }>();
  const location = useLocation();
  const { orderNumber } = (location.state || {}) as { orderNumber?: string };
  const { theme } = useThemeContext();
  
  const {
    data: order,
    allocatableItems,
    loading: eligibleOrderDetailsLoading,
    error,
    fetchAllocationData,
    manualRefresh,
  } = useAllocationEligibleOrderDetails(orderId || '');
  
  const { warehouses, refreshWarehouses, warehouseLoading, warehouseError } = useProductsWarehouseDropdown();
  
  useEffect(() => {
    if (orderId) {
      fetchAllocationData();
    }
  }, [orderId, fetchAllocationData]);
  
  if (!orderType || !orderId) {
    return (
      <ErrorDisplay>
        <ErrorMessage message="Invalid URL. Please check the link and try again." />
      </ErrorDisplay>
    );
  }
  
  if (eligibleOrderDetailsLoading) {
    return <Loading message="Loading allocation details..." />;
  }
  
  if (error || warehouseError) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error || warehouseError} />
      </ErrorDisplay>
    );
  }
  console.log("loading", eligibleOrderDetailsLoading)
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <CustomTypography variant="h4">
          {orderNumber || order?.order_number} – Inventory Allocation
        </CustomTypography>
        
        {order?.order_status && (
          <Chip
            label={order.order_status}
            sx={{
              fontWeight: 500,
              textTransform: 'uppercase',
              ...getStatusColor(order.order_status_code, theme),
            }}
          />
        )}
      </Stack>
      
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <GoBackButton />
        <CustomButton onClick={manualRefresh}>
          Refresh Data
        </CustomButton>
      </Stack>
      
      <InventoryAllocationDetailsTable
        items={allocatableItems}
        eligibleOrderDetailsLoading={eligibleOrderDetailsLoading}
        orderId={orderId}
        warehouses={warehouses}
        warehouseLoading={warehouseLoading}
        refreshWarehouses={refreshWarehouses}
      />
    </Box>
  );
};

export default OrderInventoryAllocationPage;
