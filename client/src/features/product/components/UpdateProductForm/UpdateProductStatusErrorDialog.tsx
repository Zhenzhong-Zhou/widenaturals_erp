import type { FC } from 'react';
import Box from '@mui/material/Box';
import ErrorIcon from '@mui/icons-material/Error';
import CustomDialog from '@components/common/CustomDialog';
import ResultBody from '@components/common/ResultBody';

interface UpdateProductStatusErrorDialogProps {
  open: boolean;
  onClose: () => void;
  error?: string | null;
  productName?: string;
}

const UpdateProductStatusErrorDialog: FC<
  UpdateProductStatusErrorDialogProps
> = ({ open, onClose, error, productName }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Update Failed"
      confirmButtonText="Close"
      onConfirm={onClose}
      showCancelButton={false}
    >
      <ResultBody
        icon={<ErrorIcon color="error" sx={{ fontSize: 48 }} />}
        message="Failed to Update Product Status"
        details={
          <>
            {productName && (
              <Box>
                <strong>Product:</strong> {productName}
              </Box>
            )}

            {error ? (
              <Box sx={{ mt: 1 }}>{error}</Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                An unexpected error occurred. Please try again.
              </Box>
            )}
          </>
        }
      />
    </CustomDialog>
  );
};

export default UpdateProductStatusErrorDialog;
