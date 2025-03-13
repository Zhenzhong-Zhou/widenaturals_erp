import { FC } from "react";
import Box from "@mui/material/Box";
import { useCustomers } from '../../../hooks';
import { Typography } from '@components/index.ts';
import { CreateCustomerModal } from '../index.ts';

const CustomersPage: FC = () => {
  const { customers } = useCustomers();
  
  
  return (
    <Box sx={{ p: 3, maxWidth: "600px", mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Customer Management
      </Typography>
      
      {/* Create Customer Modal Trigger */}
      <CreateCustomerModal />
      
      <Typography variant="h6" sx={{ mt: 2 }}>
        Customers List
      </Typography>
      <ul>
        {customers.map((customer) => (
          <li key={customer.id}>{customer.id}</li>
        ))}
      </ul>
    </Box>
  );
};

export default CustomersPage;
