import type { FC } from 'react';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CustomDialog, ResultBody } from '@components/index';
import type { UpdateSkuMetadataResponse } from '@features/sku/state';

interface UpdateSkuMetadataSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  skuCode: string;
  responseData: UpdateSkuMetadataResponse;
}

const UpdateSkuMetadataSuccessDialog: FC<
  UpdateSkuMetadataSuccessDialogProps
> = ({ open, onClose, skuCode, responseData }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Metadata Updated"
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

export default UpdateSkuMetadataSuccessDialog;
