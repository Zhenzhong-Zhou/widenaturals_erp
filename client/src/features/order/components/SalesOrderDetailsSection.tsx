import { FC, useMemo } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, DetailsSection, ErrorMessage, Loading } from '@components/index.ts';
import Typography from '@components/common/Typography.tsx';
import { useSalesOrderDetails } from '../../../hooks';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { formatCurrency } from '@utils/textUtils.ts';
import { OrderData } from '../state/orderTypes.ts';

interface SalesOrderDetailsSectionProps {
  orderId: string;
}

const SalesOrderDetailsSection: FC<SalesOrderDetailsSectionProps> = ({ orderId }) => {
  const { data, loading, error, refresh } = useSalesOrderDetails(orderId);
  console.log(data)
  // Process data regardless of its availability, hooks should always be called in the same order
  const filteredOrderDetails = useMemo(() => {
    if (!data?.data) return null;
    
    // Explicitly define the type for `orderDetails`
    const orderDetails: Partial<OrderData> = { ...data.data };
    
    // Define sensitive keys
    const sensitiveKeys: (keyof OrderData)[] = ['order_id'];
    
    // Remove sensitive keys
    sensitiveKeys.forEach((key) => delete orderDetails[key]);
    
    // Format Dates & Prices
    if (orderDetails.order_date) orderDetails.order_date = formatDate(orderDetails.order_date);
    if (orderDetails.subtotal) orderDetails.subtotal = formatCurrency(orderDetails.subtotal);
    if (orderDetails.tax_amount) orderDetails.tax_amount = formatCurrency(orderDetails.tax_amount);
    if (orderDetails.total_amount) orderDetails.total_amount = formatCurrency(orderDetails.total_amount);
    
    if (Array.isArray(orderDetails.items)) {
      orderDetails.items = orderDetails.items.map(item => {
        const transformedItem = { ...item };
        
        if (transformedItem.system_price) transformedItem.system_price = formatCurrency(transformedItem.system_price);
        if (transformedItem.adjusted_price) transformedItem.adjusted_price = formatCurrency(transformedItem.adjusted_price);
        
        // Safely delete keys by asserting to Record<string, any>
        delete (transformedItem as Record<string, any>).order_item_id;
        delete (transformedItem as Record<string, any>).product_id;
        
        return transformedItem;
      });
    }
    
    return orderDetails;
  }, [data]);
  
  if (loading) return <Loading message="Loading Sales Order Details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!filteredOrderDetails) return <Typography>No order details available.</Typography>;
  
  return (
    <Box
      sx={{
        padding: 3,
        margin: 'auto',
        maxWidth: '1200px',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Sales Order Details
      </Typography>
      
      <CustomButton onClick={refresh}>
        Refresh Data
      </CustomButton>
      
      <DetailsSection data={filteredOrderDetails} />
    </Box>
  );
};

export default SalesOrderDetailsSection;
