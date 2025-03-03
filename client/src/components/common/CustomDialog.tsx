import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

interface CommonDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmButtonText?: string; // Optional confirm button
  onConfirm?: () => void; // Optional confirm button action
}

const CustomDialog: React.FC<CommonDialogProps> = ({
                                                     open,
                                                     onClose,
                                                     title,
                                                     children,
                                                     confirmButtonText,
                                                     onConfirm,
                                                   }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {typeof children === "string" ? <Typography>{children}</Typography> : children}
      </DialogContent>
      {confirmButtonText && onConfirm && (
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button variant="contained" onClick={onConfirm} color="primary">
            {confirmButtonText}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CustomDialog;
