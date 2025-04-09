import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import type { SxProps, Theme } from '@mui/system';
import Typography from '@components/common/Typography';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

const modalStyles = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

const CustomModal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  sx,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={{ ...modalStyles, ...sx }}>
        {title && (
          <Typography id="modal-title" variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
        )}
        <Box id="modal-description" sx={{ mb: 2 }}>
          {children}
        </Box>
        {actions && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default CustomModal;
