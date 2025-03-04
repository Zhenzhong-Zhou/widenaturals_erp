import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { CustomButton, Typography } from '@components/index.ts';

interface CommonDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode; // Optional content
  actions?: React.ReactNode; // New prop for action buttons
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
          {typeof children === "string" ? <Typography>{children}</Typography> : children}
        </DialogContent>
      )}
      <DialogActions>
        {actions}
        {confirmButtonText && onConfirm && (
          <>
            <CustomButton onClick={onClose} color="secondary">Cancel</CustomButton>
            <CustomButton variant="contained" onClick={onConfirm} color="primary">
              {confirmButtonText}
            </CustomButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
