import type { FC } from 'react';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomDialog from '@components/common/CustomDialog';
import ResultBody from '@components/common/ResultBody';
import { UpdateSkuStatusResponse } from '@features/sku/state';

interface UpdateSkuStatusSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  skuCode: string;
  newStatusName?: string;
  responseData: UpdateSkuStatusResponse
}

const UpdateSkuStatusSuccessDialog: FC<UpdateSkuStatusSuccessDialogProps> = ({
                                                                               open,
                                                                               onClose,
                                                                               skuCode,
                                                                               newStatusName,
                                                                               responseData,
}) => {
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
              <strong>SKU:</strong> {skuCode}
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

export default UpdateSkuStatusSuccessDialog;
