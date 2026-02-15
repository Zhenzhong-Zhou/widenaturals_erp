import type { FC } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CustomModal, CustomTypography } from '@components/index';
import { ChangePasswordForm } from '@features/auth/password/components';
import type { PasswordUpdateSubmitData } from '@features/auth/password/components/ChangePasswordForm';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PasswordUpdateSubmitData) => void;
  success?: boolean;
  loading?: boolean;
  changedAt?: string | null;
  error?: string | null;
}

/**
 * ChangePasswordModal
 *
 * UI wrapper responsible for:
 * - Rendering password change form inside a modal
 * - Displaying success/error feedback
 * - Communicating submission upward
 *
 * Does NOT:
 * - Perform API calls
 * - Handle logout logic
 * - Manage authentication state
 */
const ChangePasswordModal: FC<ChangePasswordModalProps> = ({
  open,
  onClose,
  onSubmit,
  success,
  loading,
  changedAt,
  error,
}) => {
  const theme = useTheme();

  const formattedChangedAt = changedAt
    ? new Date(changedAt).toLocaleString()
    : null;

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      aria-labelledby="change-password-title"
    >
      {/* Full-screen overlay */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0, // top:0 right:0 bottom:0 left:0
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1300,
        }}
      >
        {/* Modal content */}
        <Box
          sx={{
            position: 'relative',
            bgcolor: 'background.paper',
            width: '100%',
            maxWidth: 820,
            mx: 2, // mobile breathing room
            boxShadow: 24,
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            maxHeight: '80vh',
            overflowY: 'auto',
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
              id="change-password-title"
              variant="h6"
              component="h2"
            >
              Change Password
            </CustomTypography>

            <IconButton onClick={onClose} aria-label="close">
              <FontAwesomeIcon
                icon={faTimes}
                style={{ color: theme.palette.text.primary }}
              />
            </IconButton>
          </Box>

          {/* Info */}
          <Alert severity="info" sx={{ mb: 2 }}>
            After changing your password, you will be logged out and required to
            log in again.
          </Alert>

          {/* Feedback */}
          <Box sx={{ mb: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 1 }}>
                Password updated successfully.
                <br />
                Redirecting to login…
              </Alert>
            )}

            {formattedChangedAt && (
              <CustomTypography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  color: 'text.secondary',
                  mt: 0.5,
                }}
              >
                Updated at {formattedChangedAt}
              </CustomTypography>
            )}
          </Box>

          {/* Form */}
          <ChangePasswordForm
            onSubmit={onSubmit}
            loading={loading}
            disabled={loading || success}
          />
        </Box>
      </Box>
    </CustomModal>
  );
};

export default ChangePasswordModal;
