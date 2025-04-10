import { ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';

interface CommonDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode; // Optional content
  actions?: ReactNode; // New prop for action buttons
  confirmButtonText?: string; // Optional confirm button
  onConfirm?: () => void; // Optional confirm button action
}

const CustomDialog: React.FC<CommonDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  confirmButtonText,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      {children && (
        <DialogContent dividers>
          {typeof children === 'string' ? (
            <CustomTypography>{children}</CustomTypography>
          ) : (
            children
          )}
        </DialogContent>
      )}
      <DialogActions>
        {actions}
        {confirmButtonText && onConfirm && (
          <>
            <CustomButton onClick={onClose} color="secondary">
              Cancel
            </CustomButton>
            <CustomButton
              variant="contained"
              onClick={onConfirm}
              color="primary"
            >
              {confirmButtonText}
            </CustomButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
