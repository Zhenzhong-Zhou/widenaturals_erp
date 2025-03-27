import { FC, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Loading, Typography } from '@components/index.ts';
import { CreateSaleOrderForm, OrderFormModal, OrdersTable, OrderTypesDropdown } from '../index.ts';
import { useSalesOrders } from '../../../hooks';

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
  const { loading, success, salesOrderId, error, createOrder } = useSalesOrders();
  
  const handleOrderTypeChange = (id: string, name: string, category: string) => {
    if (selectedOrderType?.id === id) {
      // Re-selecting the same order type should re-trigger the modal
      setModalOpen(true);
    } else {
      // Set the selected order type and open modal
      const selectedType = { id, name, category };
      setSelectedOrderType(selectedType);
      setLatestOrderType(selectedType); // Store in latestOrderType
      if (id) setModalOpen(true);
    }
  };
  
  // Handle the success or error after submission
  useEffect(() => {
    if (success || error) {
      console.log(success ? `Sales order created successfully with ID: ${salesOrderId}` : `Failed to create sales order: ${error}`);
      setModalOpen(false); // Close the modal whether it's a success or failure
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
      <Typography variant="h4" gutterBottom>
        Create New Order
      </Typography>
      
      <OrderTypesDropdown
        value={selectedOrderType?.id || null}
        onChange={handleOrderTypeChange}
      />
      
      {latestOrderType && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Selected Order Type: <strong>{latestOrderType.name}</strong>
        </Typography>
      )}
      
      {/* Display Loading Indicator When Processing */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Loading />
        </Box>
      )}
      
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
          <Typography variant="h6" sx={{ textAlign: 'center', marginTop: 2 }}>
            This order type is not supported yet.
          </Typography>
        )}
      </OrderFormModal>
      
      <OrdersTable/>
    </Box>
  );
};

export default OrderPage;
