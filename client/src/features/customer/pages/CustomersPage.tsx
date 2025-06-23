import { type FC, useState } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import CustomerCreateDialog from '@features/customer/components/CustomerCreateDialog';

const CustomersPage: FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <CustomTypography
        sx={{
          fontWeight: 600,
          lineHeight: 1.3,
          minHeight: '1.25rem',
        }}
      >
        Customer Management
      </CustomTypography>

      {/* Separate Button to Open Modal */}
      <CustomButton variant="contained" onClick={() => setDialogOpen(true)}>
        Create Customer
      </CustomButton>
      
      <CustomerCreateDialog
        onClose={() => setDialogOpen(false)}
        open={dialogOpen}
      />

      {/*<CustomerTable />*/}
    </Box>
  );
};

export default CustomersPage;
