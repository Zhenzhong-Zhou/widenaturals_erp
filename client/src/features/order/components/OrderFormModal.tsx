import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomModal from '@components/common/CustomModal';
import CustomTypography from '@components/common/CustomTypography';

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
        <CustomTypography variant="h6" gutterBottom>
          {title}
        </CustomTypography>
        {children}
      </Box>
    </CustomModal>
  );
};

export default OrderFormModal;
