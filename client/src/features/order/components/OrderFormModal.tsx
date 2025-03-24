import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { CustomModal, Typography } from '@components/index';

interface OrderFormModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

/**
 * Dedicated Modal Component for Creating Orders
 */
const OrderFormModal: FC<OrderFormModalProps> = ({ open, title, children, onClose }) => {
  return (
    <CustomModal
      open={open}
      onClose={onClose}
      sx={{
        // maxWidth: '100vw',
        width: 'auto',
        // minWidth: '75vw',
        maxHeight: '100vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          p: 4,
          bgcolor: 'white',
          borderRadius: 2,
          maxWidth: 600,
          width: '100%',
          mx: 'auto',
          mt: 10,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {children}
      </Box>
    </CustomModal>
  );
};

export default OrderFormModal;
