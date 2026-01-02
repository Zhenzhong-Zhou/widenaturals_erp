import type { FC } from 'react';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomDialog from '@components/common/CustomDialog';
import ResultBody from '@components/common/ResultBody';

interface UpdateProductInfoSuccessDialogProps {
  open: boolean;
  onClose: () => void;

  /** Product name to display */
  productName: string;

  /** Optional: list of fields that were updated */
  updatedFields?: string[];

  /** Optional: API response payload (audit id, timestamps, etc.) */
  responseData?: any;
}

const UpdateProductInfoSuccessDialog: FC<
  UpdateProductInfoSuccessDialogProps
> = ({ open, onClose, productName, updatedFields, responseData }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Update Successful"
      confirmButtonText="Close"
      onConfirm={onClose}
      showCancelButton={false}
    >
      <ResultBody
        icon={<CheckCircleIcon color="success" sx={{ fontSize: 48 }} />}
        message={responseData.message}
        details={
          <>
            {/* Product name */}
            <Box>
              <strong>Product:</strong> {productName}
            </Box>

            {/* Updated fields */}
            {updatedFields && updatedFields.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <strong>Updated Fields:</strong> {updatedFields.join(', ')}
              </Box>
            )}
          </>
        }
      />
    </CustomDialog>
  );
};

export default UpdateProductInfoSuccessDialog;
