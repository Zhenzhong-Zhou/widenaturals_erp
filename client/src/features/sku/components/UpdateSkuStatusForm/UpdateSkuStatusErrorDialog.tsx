import type { FC } from 'react';
import Box from '@mui/material/Box';
import ErrorIcon from '@mui/icons-material/Error';
import CustomDialog from '@components/common/CustomDialog';
import ResultBody from '@components/common/ResultBody';

interface UpdateSkuStatusErrorDialogProps {
  open: boolean;
  onClose: () => void;
  error?: string | null;
  skuCode?: string;
}

const UpdateSkuStatusErrorDialog: FC<UpdateSkuStatusErrorDialogProps> = ({
                                                                           open,
                                                                           onClose,
                                                                           error,
                                                                           skuCode,
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
        message="Failed to Update SKU Status"
        details={
          <>
            {skuCode && <Box><strong>SKU:</strong> {skuCode}</Box>}
            
            {error ? (
              <Box style={{ marginTop: 6 }}>{error}</Box>
            ) : (
              <Box style={{ marginTop: 6 }}>
                An unexpected error occurred. Please try again.
              </Box>
            )}
          </>
        }
      />
    </CustomDialog>
  );
};

export default UpdateSkuStatusErrorDialog;
