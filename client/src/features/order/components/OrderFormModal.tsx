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
const OrderFormModal: FC<OrderFormModalProps> = ({
  open,
  title,
  children,
  onClose,
}) => {
  return (
    <CustomModal
      open={open}
      onClose={onClose}
      sx={{
        width: '100%',
        minWidth: { xs: '90vw', sm: '60vw', md: '40vw' },
        maxHeight: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 4,
        backgroundColor: 'transparent',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          bgcolor: 'background.paper',
          borderRadius: 2, // theme.shape.borderRadius shortcut
          boxShadow: 6,
          px: { xs: 3, md: 4 },
          py: { xs: 4, md: 5 },
          mt: { xs: 4, md: 10 },
          transition: 'all 0.3s ease',
          minHeight: 900,
        }}
      >
        <CustomTypography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 600, color: 'text.primary' }}
        >
          {title}
        </CustomTypography>
        {children}
      </Box>
    </CustomModal>
  );
};

export default OrderFormModal;
