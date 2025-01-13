import { FC, ReactNode } from 'react';
import { Box, Modal } from '@mui/material';
import { Typography } from '@components/index';

interface ModalProps {
  open: boolean; // Controls whether the modal is visible
  onClose: () => void; // Function to close the modal
  title?: string; // Optional title for the modal
  children: ReactNode; // Content inside the modal
  actions?: ReactNode; // Optional action buttons for the modal
}

const modalStyles = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

const CustomModal: FC<ModalProps> = ({ open, onClose, title, children, actions }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={modalStyles}>
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
