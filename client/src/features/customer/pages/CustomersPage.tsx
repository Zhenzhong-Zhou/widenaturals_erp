import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, Typography } from '@components/index.ts';
import { CreateCustomerModal, CustomerTable } from '../index.ts';

const CustomersPage: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Customer Management
      </Typography>
      
      {/* Separate Button to Open Modal */}
      <CustomButton variant="contained" onClick={() => setModalOpen(true)}>
        Create Customer
      </CustomButton>
      
      {/* Modal: Controlled by State */}
      <CreateCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} />
      
      <CustomerTable />
    </Box>
  );
};

export default CustomersPage;
