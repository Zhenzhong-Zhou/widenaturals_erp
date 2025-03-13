import { FC } from "react";
import Box from "@mui/material/Box";
import { Typography } from '@components/index.ts';
import { CreateCustomerModal, CustomerTable } from '../index.ts';

const CustomersPage: FC = () => {
  
  return (
    <Box sx={{ p: 3}}>
      <Typography variant="h4" gutterBottom>
        Customer Management
      </Typography>
      
      {/* Create Customer Modal Trigger */}
      <CreateCustomerModal />
    
      <CustomerTable/>
    </Box>
  );
};

export default CustomersPage;
