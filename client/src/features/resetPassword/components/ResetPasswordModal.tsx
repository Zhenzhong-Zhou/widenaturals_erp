import { FC } from 'react';
import { Box, IconButton, Alert, Backdrop } from '@mui/material';
import { Typography } from '@components/index.ts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ResetPasswordForm from './ResetPasswordForm';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useThemeContext } from '../../../context/ThemeContext';

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

const ResetPasswordModal: FC<ResetPasswordModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { theme } = useThemeContext();

  return (
    <Backdrop
      open={open}
      onClick={onClose} // Close the modal when clicking outside
      sx={{ zIndex: 1300, bgcolor: 'rgba(0, 0, 0, 0.5)' }} // Adjust the backdrop's appearance
    >
      <Box
        component="div"
        onClick={(e) => e.stopPropagation()} // Prevent the modal itself from triggering the close
        sx={{
          position: 'relative',
          bgcolor: 'background.paper',
          width: 400,
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          zIndex: 1400, // Ensure the modal content is above the backdrop
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            Reset Password
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <FontAwesomeIcon
              icon={faTimes}
              style={{
                color: theme.palette.text.primary,
              }}
            />
          </IconButton>
        </Box>

        {/* Add a warning or hint */}
        <Alert severity="info" sx={{ mb: 2 }}>
          Please note: After successfully resetting your password, you will be
          logged out and required to log in again with your new password.
        </Alert>

        <ResetPasswordForm onSubmit={onSubmit} />
      </Box>
    </Backdrop>
  );
};

export default ResetPasswordModal;
