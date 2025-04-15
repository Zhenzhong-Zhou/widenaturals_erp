import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import type { SxProps, Theme } from '@mui/system';
import CustomTypography from '@components/common/CustomTypography';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

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
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 200,
        },
      }}
    >
      <Box
        role="dialog"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 480,
          minWidth: 300,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          zIndex: (theme) => theme.zIndex.modal,
          fontFamily: "'Roboto', sans-serif",
          ...sx,
        }}
      >
        {title && (
          <CustomTypography
            id="modal-title"
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 600,
              fontSize: '1.25rem',
              lineHeight: 1.5,
            }}
          >
            {title}
          </CustomTypography>
        )}
        
        <Box id="modal-description" sx={{ mb: actions ? 3 : 0 }}>
          {children}
        </Box>
        
        {actions && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
              flexWrap: 'wrap',
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
