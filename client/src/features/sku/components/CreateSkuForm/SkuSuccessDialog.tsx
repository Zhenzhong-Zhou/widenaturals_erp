import { type FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Stack } from '@mui/material';
import { CustomButton, CustomDialog, CustomTypography } from '@components/index';
import type { CreateSkuResponse, CreatedSkuRecord } from '@features/sku/state';

interface SkuSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  response?: CreateSkuResponse;
}

const SkuSuccessDialog: FC<SkuSuccessDialogProps> = ({
  open,
  onClose,
  title = 'SKU created successfully.',
  response,
}) => {
  const navigate = useNavigate();

  const skuList: CreatedSkuRecord[] = useMemo(
    () => response?.data ?? [],
    [response]
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={skuList.length > 1 ? 'SKUs Created' : 'SKU Created'}
      confirmButtonText="Close"
      onConfirm={onClose}
      showCancelButton={false}
    >
      <Box sx={{ px: 5 }}>
        <CustomTypography variant="body1" sx={{ mb: 2 }}>
          {title}
        </CustomTypography>

        <CustomTypography variant="body1" sx={{ mb: 2 }}>
          {response?.message}
        </CustomTypography>

        {/* SKU list with View buttons */}
        <Stack spacing={2}>
          {skuList.map((sku) => (
            <Stack
              key={sku.id}
              direction="row"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #eee',
                borderRadius: 1,
                padding: 1.5,
              }}
            >
              <CustomTypography variant="body1" sx={{ fontWeight: 500 }}>
                {sku.skuCode}
              </CustomTypography>

              <CustomButton
                size="small"
                variant="outlined"
                onClick={() => navigate(`/skus/${sku.id}`)}
              >
                View
              </CustomButton>
            </Stack>
          ))}
        </Stack>

        {/* Deep link */}
        {skuList.length > 1 && (
          <Box sx={{ mt: 3 }}>
            <CustomButton
              variant="contained"
              fullWidth
              onClick={() => navigate('/skus')}
            >
              Back to SKU List
            </CustomButton>
          </Box>
        )}
      </Box>
    </CustomDialog>
  );
};

export default SkuSuccessDialog;
