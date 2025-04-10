import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography';
import CustomButton from '@components/common/CustomButton';
import CreateCustomerModal from '@features/customer/components/CreateCustomerModal';
import CustomerTable from '@features/customer/components/CustomerTable';

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
