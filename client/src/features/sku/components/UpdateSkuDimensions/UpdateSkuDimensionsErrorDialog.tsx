import type { FC } from 'react';
import Box from '@mui/material/Box';
import ErrorIcon from '@mui/icons-material/Error';
import { CustomDialog, ResultBody } from '@components/index';

interface UpdateSkuDimensionsErrorDialogProps {
  open: boolean;
  onClose: () => void;
  error?: string | null;
  skuCode?: string;
}

const UpdateSkuDimensionsErrorDialog: FC<
  UpdateSkuDimensionsErrorDialogProps
> = ({ open, onClose, error, skuCode }) => {
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
        message="Failed to Update SKU Dimensions"
        details={
          <>
            {skuCode && (
              <Box>
                <strong>SKU:</strong> {skuCode}
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

export default UpdateSkuDimensionsErrorDialog;
