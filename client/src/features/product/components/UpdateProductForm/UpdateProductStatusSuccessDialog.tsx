import type { FC } from 'react';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomDialog from '@components/common/CustomDialog';
import ResultBody from '@components/common/ResultBody';
import { UpdateSkuStatusResponse } from '@features/sku/state';

interface UpdateProductStatusSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  newStatusName?: string;
  responseData: UpdateSkuStatusResponse;
}

const UpdateProductStatusSuccessDialog: FC<
  UpdateProductStatusSuccessDialogProps
> = ({ open, onClose, productName, newStatusName, responseData }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Status Updated"
      confirmButtonText="OK"
      onConfirm={onClose}
    >
      <ResultBody
        icon={<CheckCircleIcon color="success" sx={{ fontSize: 48 }} />}
        message={responseData.message}
        details={
          <>
            <Box>
              <strong>Product:</strong> {productName}
            </Box>

            {newStatusName && (
              <Box>
                <strong>New Status:</strong> {newStatusName}
              </Box>
            )}
          </>
        }
      />
    </CustomDialog>
  );
};

export default UpdateProductStatusSuccessDialog;
