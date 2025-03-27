import { FC, useMemo } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, DetailsSection, ErrorMessage, Loading } from '@components/index.ts';
import Typography from '@components/common/Typography.tsx';
import { useSalesOrderDetails } from '../../../hooks';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter, formatCurrency } from '@utils/textUtils.ts';
import { OrderData } from '../state/orderTypes.ts';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';

interface SalesOrderDetailsSectionProps {
  orderId: string;
}

const SalesOrderDetailsSection: FC<SalesOrderDetailsSectionProps> = ({ orderId }) => {
  const { data, loading, error, refresh } = useSalesOrderDetails(orderId);
  
  const filteredOrderDetails = useMemo(() => {
    if (!data?.data) return null;
    
    // Deep clone the data to prevent mutation errors
    const orderDetails: Partial<OrderData> = JSON.parse(JSON.stringify(data.data));
    
    // Define sensitive keys
    const sensitiveKeys: (keyof OrderData)[] = ['order_id'];
    
    // Remove sensitive keys
    sensitiveKeys.forEach((key) => delete orderDetails[key]);
    
    // Format Category, Customer Name, Dates & Prices
    if (orderDetails.order_category) orderDetails.order_category = capitalizeFirstLetter(orderDetails.order_category);
    if (orderDetails.customer_name) orderDetails.customer_name = capitalizeFirstLetter(orderDetails.customer_name);
    if (orderDetails.discount_amount) orderDetails.discount_amount = formatCurrency(orderDetails.discount_amount);
    if (orderDetails.subtotal) orderDetails.subtotal = formatCurrency(orderDetails.subtotal);
    if (orderDetails.tax_amount) orderDetails.tax_amount = formatCurrency(orderDetails.tax_amount);
    if (orderDetails.total_amount) orderDetails.total_amount = formatCurrency(orderDetails.total_amount);
    
    // Handling order_date formatting (object or string)
    if (orderDetails.order_date) {
      if (typeof orderDetails.order_date === 'string') {
        orderDetails.order_date = formatDate(orderDetails.order_date);
      } else if (typeof orderDetails.order_date === 'object') {
        orderDetails.order_date = `Order Date: ${formatDate(orderDetails.order_date.order_date)} | Sales Order Date: ${formatDate(orderDetails.order_date.sales_order_date)}`;
      }
    }
    
    // Format delivery_info if present
    if (orderDetails.delivery_info) orderDetails.delivery_info.method = capitalizeFirstLetter(orderDetails.delivery_info.method);
    
    // Handle metadata display
    if (!orderDetails.order_metadata || Object.keys(orderDetails.order_metadata).length === 0) orderDetails.order_metadata = { message: 'N/A' }; // Assigning an object instead of a string
    
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
    <Card
      sx={{
        margin: 'auto',
        maxWidth: '1000px',
        borderRadius: 3,
        boxShadow: 4,
        padding: 3,
        marginTop: 4,
        backgroundColor: 'background.paper',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Sales Order Details</Typography>
          <CustomButton onClick={refresh}>Refresh Data</CustomButton>
        </Box>
        
        <Divider sx={{ marginBottom: 2 }} />
        
        <Grid container spacing={3}>
          <Grid size={6}>
            <DetailsSection data={{
              'Order Number': filteredOrderDetails.order_number,
              'Order Category': filteredOrderDetails.order_category,
              'Order Type': filteredOrderDetails.order_type,
              'Order Date': filteredOrderDetails.order_date,
              'Customer Name': filteredOrderDetails.customer_name,
              'Order Status': filteredOrderDetails.order_status,
              'Delivery Method': filteredOrderDetails.delivery_info?.method,
              'Tracking Number': filteredOrderDetails.delivery_info?.tracking_info,
              'MetaData': filteredOrderDetails.order_metadata,
            }} />
          </Grid>
          
          <Grid size={6}>
            <DetailsSection data={{
              'Subtotal': filteredOrderDetails.subtotal,
              'Tax Rate': `${filteredOrderDetails.tax_rate}%`,
              'Tax Amount': filteredOrderDetails.tax_amount,
              'Shipping Fee': filteredOrderDetails.shipping_fee,
              'Total Amount': filteredOrderDetails.total_amount,
              'Discount': filteredOrderDetails.discount,
              'Discount Amount': filteredOrderDetails.discount_amount,
              'Order Note': filteredOrderDetails.order_note || 'N/A',
            }} />
          </Grid>
        </Grid>
        
        <Divider sx={{ marginY: 2 }} />
        
        {filteredOrderDetails.items && (
          <Box>
            <Typography variant="h6" sx={{ marginBottom: 1 }}>Order Items</Typography>
            {filteredOrderDetails.items.map((item, index) => (
              <Card
                key={index}
                sx={{ marginBottom: 2, padding: 2, borderRadius: 2, backgroundColor: 'background.default' }}
              >
                <DetailsSection data={item} />
              </Card>
            ))}
          </Box>
        )}
        
        {/* Show tracking info if exists */}
        {filteredOrderDetails.delivery_info?.tracking_info && (
          <Box mt={2}>
            <Typography variant="h6" sx={{ marginBottom: 1 }}>Tracking Information</Typography>
            <DetailsSection data={filteredOrderDetails.delivery_info.tracking_info} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesOrderDetailsSection;
