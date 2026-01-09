import type { FC } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CustomModal from '@components/common/CustomModal';
import CustomTypography from '@components/common/CustomTypography';
import ResetPasswordForm from '@features/resetPassword/components/ResetPasswordForm';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
  const theme = useTheme();

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      aria-labelledby="reset-password-title"
      sx={{
        display: 'flex', // Center the modal
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(5px)', // Soften the background blur
        bgcolor: 'rgba(0, 0, 0, 0.3)', // Darker overlay
        width: 'auto',
        height: 'auto', // Full height for better centering
      }}
    >
      <Box
        component="div"
        sx={{
          position: 'relative',
          bgcolor: 'background.paper',
          width: 'auto', // Responsive width
          maxWidth: 420, // Limit width on larger screens
          minWidth: 320, // Prevent shrinking too much on mobile
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          zIndex: 1400,
          maxHeight: '80vh', // Prevent modal from exceeding screen height
          overflowY: 'auto', // Enable scrolling when needed
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <CustomTypography
            id="reset-password-title"
            variant="h6"
            component="h2"
          >
            Reset Password
          </CustomTypography>
          <IconButton onClick={onClose} aria-label="close">
            <FontAwesomeIcon
              icon={faTimes}
              style={{
                color: theme.palette.text.primary,
              }}
            />
          </IconButton>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 2 }}>
          Please note: After successfully resetting your password, you will be
          logged out and required to log in again with your new password.
        </Alert>

        {/* Reset Password Form */}
        <ResetPasswordForm onSubmit={onSubmit} />
      </Box>
    </CustomModal>
  );
};

export default ResetPasswordModal;
