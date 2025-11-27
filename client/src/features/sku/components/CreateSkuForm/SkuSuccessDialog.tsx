import { type FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CustomDialog from '@components/common/CustomDialog';
import DetailsSection, {
  type DetailsSectionField,
} from '@components/common/DetailsSection';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
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
  
  const stats = response?.stats;
  
  const transformFields = (data: CreatedSkuRecord): DetailsSectionField[] => [
    { label: 'SKU Code', value: data.skuCode },
  ];
  
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
        
        {/* Optional stats block */}
        {stats && (
          <Box sx={{ mb: 3 }}>
            <DetailsSection
              sectionTitle="Summary"
              fields={[
                { label: 'Total Submitted', value: stats.inputCount },
                { label: 'Successfully Created', value: stats.processedCount },
                { label: 'Processing Time (ms)', value: `${stats.elapsedMs} ms` }
              ]}
            />
          </Box>
        )}
        
        {/* SKU details */}
        <Stack spacing={4}>
          {skuList.map((sku, idx) => (
            <DetailsSection
              key={sku.id}
              sectionTitle={
                skuList.length > 1 ? `SKU #${idx + 1}` : 'SKU Details'
              }
              fields={transformFields(sku)}
            />
          ))}
        </Stack>
        
        {/* Deep link */}
        {skuList.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <CustomButton
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => skuList?.[0]?.id && navigate(`/skus/${skuList[0].id}`)}
            >
              View SKU Detail
            </CustomButton>
          </Box>
        )}
      </Box>
    </CustomDialog>
  );
};

export default SkuSuccessDialog;
