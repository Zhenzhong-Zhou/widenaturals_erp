import { FC } from 'react';
import { Box, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ResetPasswordForm from './ResetPasswordForm';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useThemeContext } from '../../../context/ThemeContext.tsx';

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
}

const ResetPasswordModal: FC<ResetPasswordModalProps> = ({ onClose, onSubmit }) => {
  const { theme } = useThemeContext();
  return (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        width: 400,
        boxShadow: 24,
        borderRadius: 2,
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Reset Password</h2>
        <IconButton onClick={onClose} aria-label="close">
          <FontAwesomeIcon
            icon={faTimes}
            style={{
              color: theme.palette.text.primary,
            }}
          />
        </IconButton>
      </Box>
      <ResetPasswordForm onSubmit={onSubmit} />
    </Box>
  );
};

export default ResetPasswordModal;
