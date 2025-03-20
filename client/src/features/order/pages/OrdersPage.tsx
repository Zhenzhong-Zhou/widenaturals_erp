import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import { CustomModal, Typography } from '@components/index.ts';
import { OrderTypesDropdown } from '../index.ts';
import { DeliveryMethodDropdown } from '../../deliveryMethod';

const OrderPage: FC = () => {
  const [selectedOrderType, setSelectedOrderType] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOrderTypeChange = (id: string, name: string) => {
    setSelectedOrderType({ id, name });

    // Open modal only if a valid value is selected
    if (id) {
      setModalOpen(true);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '600px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Create New Order
      </Typography>

      <OrderTypesDropdown
        value={selectedOrderType?.id || null}
        onChange={handleOrderTypeChange}
      />

      {selectedOrderType && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Selected Order Type: <strong>{selectedOrderType.name}</strong>
        </Typography>
      )}
      
      {/* Modal for Order Form */}
      <CustomModal open={isModalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            p: 4,
            bgcolor: 'white',
            borderRadius: 2,
            maxWidth: 500,
            mx: 'auto',
            mt: 10,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Create{' '}
            {selectedOrderType?.name?.includes('Order')
              ? selectedOrderType?.name
              : `${selectedOrderType?.name} Order`}
          </Typography>
          {/*<OrderForm orderType={selectedOrderType} onClose={() => setModalOpen(false)} />*/}
        </Box>
      </CustomModal>
    </Box>
  );
};

export default OrderPage;
