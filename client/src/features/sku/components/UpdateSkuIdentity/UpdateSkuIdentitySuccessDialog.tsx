import type { FC } from 'react';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  CustomDialog,
  ResultBody
} from '@components/index';
import type { UpdateSkuIdentityResponse } from '@features/sku/state';

interface UpdateSkuIdentitySuccessDialogProps {
  open: boolean;
  onClose: () => void;
  skuCode: string;
  responseData: UpdateSkuIdentityResponse;
}

const UpdateSkuIdentitySuccessDialog: FC<
  UpdateSkuIdentitySuccessDialogProps
> = ({ open, onClose, skuCode, responseData }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Identity Updated"
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

export default UpdateSkuIdentitySuccessDialog;
