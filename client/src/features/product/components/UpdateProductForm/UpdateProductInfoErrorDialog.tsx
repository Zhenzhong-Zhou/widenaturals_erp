import type { FC } from 'react';
import Box from '@mui/material/Box';
import ErrorIcon from '@mui/icons-material/Error';
import CustomDialog from '@components/common/CustomDialog';
import ResultBody from '@components/common/ResultBody';

interface UpdateProductInfoErrorDialogProps {
  open: boolean;
  onClose: () => void;
  error?: string | null;
  productName?: string;

  /**
   * Optional list of fields that were being updated
   * Useful for debugging and explaining what failed.
   */
  fields?: string[];
}

const UpdateProductInfoErrorDialog: FC<UpdateProductInfoErrorDialogProps> = ({
  open,
  onClose,
  error,
  productName,
  fields,
}) => {
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
        message="Failed to Update Product Information"
        details={
          <>
            {/* Product Name */}
            {productName && (
              <Box>
                <strong>Product:</strong> {productName}
              </Box>
            )}

            {/* Updated fields if provided */}
            {fields && fields.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <strong>Fields attempted:</strong> {fields.join(', ')}
              </Box>
            )}

            {/* Error message */}
            {error ? (
              <Box sx={{ mt: 1 }}>{error}</Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                An unexpected error occurred while updating this product. Please
                try again.
              </Box>
            )}
          </>
        }
      />
    </CustomDialog>
  );
};

export default UpdateProductInfoErrorDialog;
