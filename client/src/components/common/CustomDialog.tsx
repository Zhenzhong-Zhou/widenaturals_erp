import type { FC, ReactNode } from 'react';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';

export interface CustomDialogProps extends Partial<DialogProps> {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  confirmButtonText?: string;
  onConfirm?: () => void;
  showCancelButton?: boolean;
  disableCloseOnBackdrop?: boolean;
  disableCloseOnEscape?: boolean;
}

const CustomDialog: FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  confirmButtonText,
  onConfirm,
  showCancelButton = true,
  disableCloseOnBackdrop = false,
  disableCloseOnEscape = false,
  ...rest
}) => {
  const handleClose = (
    _event: object,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (
      (disableCloseOnBackdrop && reason === 'backdropClick') ||
      (disableCloseOnEscape && reason === 'escapeKeyDown')
    ) {
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="custom-dialog-title"
      {...rest}
    >
      <DialogTitle id="custom-dialog-title">{title}</DialogTitle>

      {children && (
        <DialogContent dividers>
          {typeof children === 'string' ? (
            <CustomTypography>{children}</CustomTypography>
          ) : (
            children
          )}
        </DialogContent>
      )}

      {(actions || confirmButtonText || showCancelButton) && (
        <DialogActions>
          {actions}

          {showCancelButton && (
            <CustomButton
              onClick={(e) => {
                (e.currentTarget as HTMLButtonElement).blur();
                onClose();
              }}
              color="secondary"
            >
              Cancel
            </CustomButton>
          )}

          {confirmButtonText && onConfirm && (
            <CustomButton
              variant="contained"
              onClick={onConfirm}
              color="primary"
            >
              {confirmButtonText}
            </CustomButton>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CustomDialog;
