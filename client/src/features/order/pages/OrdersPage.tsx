import { type FC, useState, useEffect, lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import useSalesOrders from '@hooks/useSalesOrders';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';
import OrderTypesDropdown from '@features/lookup/components/OrderTypesDropdown';
import Loading from '@components/common/Loading';
import OrderFormModal from '@features/order/components/OrderFormModal';
import CreateSaleOrderForm from '@features/order/components/CreateSaleOrderForm';

const AllOrdersTable = lazy(
  () => import('@features/order/components/AllOrdersTable')
);

const OrderPage: FC = () => {
  const [selectedOrderType, setSelectedOrderType] = useState<{
    id: string;
    name: string;
    category: string;
  } | null>(null);
  const [latestOrderType, setLatestOrderType] = useState<{
    id: string;
    name: string;
    category: string;
  } | null>(null); // Store the latest selected order type

  const [isModalOpen, setModalOpen] = useState(false);
  const { loading, success, salesOrderId, error, createOrder } =
    useSalesOrders();

  // State to trigger refresh for OrdersTable
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleOrderTypeChange = (
    id: string,
    name: string,
    category: string
  ) => {
    if (selectedOrderType?.id === id) {
      // Re-selecting the same order type should re-trigger the modal
      setModalOpen(true);
    } else {
      // Set the selected order type and open modal
      const selectedType = { id, name, category };
      setSelectedOrderType(selectedType);
      setLatestOrderType(selectedType);
      if (id) setModalOpen(true);
    }
  };

  // Handle the success or error after submission
  useEffect(() => {
    if (success || error) {
      console.log(
        success
          ? `Sales order created successfully with ID: ${salesOrderId}`
          : `Failed to create sales order: ${error}`
      );
      setModalOpen(false);

      // Trigger table refresh if successful
      if (success) {
        setRefreshTrigger((prev) => !prev); // Toggle the trigger to force refresh
      }
    }
  }, [success, error, salesOrderId]);

  // Reset `selectedOrderType` to null when the dropdown closes (modal closes)
  useEffect(() => {
    if (!isModalOpen) {
      setSelectedOrderType(null);
    }
  }, [isModalOpen]);

  return (
    <Box>
      <CustomTypography>Create New Order</CustomTypography>
      <GoBackButton sx={{ borderRadius: 20 }} />
      <OrderTypesDropdown
        value={selectedOrderType?.id || null}
        onChange={handleOrderTypeChange}
      />
      {latestOrderType && (
        <CustomTypography variant="body1" sx={{ mt: 2 }}>
          Selected Order Type: <strong>{latestOrderType.name}</strong>
        </CustomTypography>
      )}
      {/* Display Loading Indicator When Processing */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Loading />
        </Box>
      )}
      {/*// todo: need to fix update state whenever user change product id aor*/}
      {/*price type id the value of price should update correctly in the input*/}
      {/*filed*/}
      {/* Modal for Order Form */}
      <OrderFormModal
        open={isModalOpen}
        title={`Create ${latestOrderType?.name?.includes('Order') ? latestOrderType?.name : `${latestOrderType?.name} Order`}`}
        onClose={() => setModalOpen(false)}
      >
        {latestOrderType?.category === 'sales' ? (
          <CreateSaleOrderForm
            onSubmit={(formData) => createOrder(latestOrderType!.id, formData)}
            onClose={() => setModalOpen(false)}
            category={latestOrderType?.category}
          />
        ) : (
          <CustomTypography
            variant="h6"
            sx={{ textAlign: 'center', marginTop: 2 }}
          >
            This order type is not supported yet.
          </CustomTypography>
        )}
      </OrderFormModal>
      <Suspense fallback={<Skeleton height={300} />}>
        <AllOrdersTable refreshTrigger={refreshTrigger} />
      </Suspense>
    </Box>
  );
};

export default OrderPage;
