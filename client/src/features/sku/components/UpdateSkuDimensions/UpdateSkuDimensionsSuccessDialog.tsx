import type { FC } from 'react';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  CustomDialog,
  ResultBody
} from '@components/index';
import type { UpdateSkuDimensionsResponse } from '@features/sku/state';

interface UpdateSkuDimensionsSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  skuCode: string;
  responseData: UpdateSkuDimensionsResponse;
}

const UpdateSkuDimensionsSuccessDialog: FC<
  UpdateSkuDimensionsSuccessDialogProps
> = ({ open, onClose, skuCode, responseData }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Dimensions Updated"
      confirmButtonText="OK"
      onConfirm={onClose}
    >
      <ResultBody
        icon={<CheckCircleIcon color="success" sx={{ fontSize: 48 }} />}
        message={responseData.message}
        details={
          <Box>
            <strong>SKU:</strong> {skuCode}
          </Box>
        }
      />
    </CustomDialog>
  );
};

export default UpdateSkuDimensionsSuccessDialog;
