import { FC } from "react";
import { useOrderTypes } from '../../../hooks';
import { ErrorDisplay, ErrorMessage, Loading, Typography } from '@components/index.ts';
import { OrderTypesTable } from '../index.ts';
import Box from '@mui/material/Box';

const OrderTypesPage: FC = () => {
  const { orderTypes, isLoading, error } = useOrderTypes();
  
  if (isLoading) return <Loading message="Loading Order Types..." />;
  if (error) return <ErrorDisplay><ErrorMessage message={error} /></ErrorDisplay>;
  
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Order Types
      </Typography>
      <OrderTypesTable data={orderTypes}/>
    </Box>
  );
};

export default OrderTypesPage;
