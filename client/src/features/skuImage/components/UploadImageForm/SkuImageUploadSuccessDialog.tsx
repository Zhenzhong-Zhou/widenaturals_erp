import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CustomDialog from '@components/common/CustomDialog';
import ResultBody from '@components/common/ResultBody';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import {
  BulkSkuImageUploadResult,
  SkuImageUploadCardData,
} from '@features/skuImage/state';
import { BatchProcessStats } from '@shared-types/api';
import { enrichBulkSkuUploadResults } from '@features/skuImage/utils/imageFormatUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  
  /** Upload summary statistics */
  stats: BatchProcessStats | null;
  
  /** Per-SKU result array */
  results: BulkSkuImageUploadResult[] | null;
  
  items: SkuImageUploadCardData[];
}

/**
 * Dialog displayed after a batch SKU image upload completes.
 * Shows a summary (success/failure) plus detailed per-SKU results.
 */
const SkuImageUploadSuccessDialog: FC<Props> = ({
                                                  open,
                                                  onClose,
                                                  stats,
                                                  results,
                                                  items,
                                                }) => {
  // Prevent crash when stats is null
  if (!stats) {
    return (
      <CustomDialog
        open={open}
        onClose={onClose}
        title="Processing…"
        confirmButtonText="OK"
        onConfirm={onClose}
      >
        <ResultBody
          icon={<ErrorIcon color="error" sx={{ fontSize: 48 }} />}
          message="Upload results are not available yet."
        />
      </CustomDialog>
    );
  }
  
  const message =
    stats?.failureCount === 0
      ? 'All SKU images uploaded successfully.'
      : 'SKU image upload completed with some errors.';
  
  // Join result with original skuCode + productName
  const enrichedResults = enrichBulkSkuUploadResults(results, items);
  
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Upload Results"
      confirmButtonText="OK"
      maxWidth="md"
    >
      <ResultBody
        icon={
          stats.failureCount === 0 ? (
            <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
          ) : (
            <ErrorIcon color="error" sx={{ fontSize: 48 }} />
          )
        }
        message={message}
        details={
          <Box sx={{ mt: 2 }}>
            {/* Summary Section */}
            <Box sx={{ mb: 2 }}>
              <Box>
                <strong>Total SKUs:</strong> {stats.total}
              </Box>
              <Box>
                <strong>Succeeded:</strong> {stats.successCount}
              </Box>
              <Box>
                <strong>Failed:</strong> {stats.failureCount}
              </Box>
              <Box>
                <strong>Time:</strong> {stats.elapsedMs} ms
              </Box>
            </Box>
            
            {/* If results missing */}
            {!results || results.length === 0 ? (
              <Box>No individual results available.</Box>
            ) : (
              <Box sx={{ maxHeight: 250, overflowY: 'auto', pr: 1 }}>
                {enrichedResults.map((r) => (
                  <Box
                    key={r.skuId}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: r.success ? 'success.light' : 'error.light',
                      bgcolor: r.success ? 'success.light' : 'error.light',
                      color: r.success ? 'success.contrastText' : 'error.contrastText',
                    }}
                  >
                    <Box><strong>Product Name:</strong> {r.productName ?? r.skuId}</Box>
                    <Box><strong>SKU:</strong> {r.skuCode ?? r.skuId}</Box>
                    <Box><strong>Result:</strong> {r.success ? 'Success' : 'Failed'}</Box>
                    {r.error && <Box><strong>Error:</strong> {r.error}</Box>}
                    <Box><strong>Images Uploaded:</strong> {r.images?.length ?? 0}</Box>
                    {r.success && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        <CustomButton
                          component={Link}
                          to={`/skus/${r.skuId}`}
                          state={{ fromUpload: true }}
                          variant="contained"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': { backgroundColor: 'primary.dark' }
                          }}
                        >
                          View Details
                        </CustomButton>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            
            {/* Footer Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <CustomButton
                variant="outlined"
                color="primary"
                onClick={onClose}
              >
                Close
              </CustomButton>
              
              <GoBackButton
                label="Back to SKU List"
                fallbackTo="/skus"
              />
            </Stack>
          </Box>
        }
      />
    </CustomDialog>
  );
};

export default SkuImageUploadSuccessDialog;
