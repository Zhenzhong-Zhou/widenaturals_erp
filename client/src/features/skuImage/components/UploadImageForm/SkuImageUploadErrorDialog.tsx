import type { FC } from "react";
import Box from "@mui/material/Box";
import ErrorIcon from "@mui/icons-material/Error";
import CustomDialog from "@components/common/CustomDialog";
import ResultBody from "@components/common/ResultBody";
import {
  BulkSkuImageUploadResult,
  SkuImageUploadCardData
} from '@features/skuImage/state';
import { enrichBulkSkuUploadResults } from '@features/skuImage/utils/imageFormatUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  
  /** General error message if the entire request failed */
  error?: string | null;
  
  /** Per-SKU results (optional—only if server partially succeeded) */
  results?: BulkSkuImageUploadResult[] | null;
  
  items: SkuImageUploadCardData[];
}

const SkuImageUploadErrorDialog: FC<Props> = ({
                                                open,
                                                onClose,
                                                error,
                                                results,
                                                items,
                                              }) => {
  // Enrich backend results with SKU code + product name
  const enrichedResults = enrichBulkSkuUploadResults(results, items);

  // Filter just the failed ones
  const failedItems = enrichedResults.filter((r) => !r.success);

  // Boolean used by UI
  const hasPerSkuErrors = failedItems.length > 0;
  
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Upload Failed"
      confirmButtonText="Close"
      onConfirm={onClose}
      showCancelButton={false}
      maxWidth="md"
    >
      <ResultBody
        icon={<ErrorIcon color="error" sx={{ fontSize: 48 }} />}
        message="SKU Image Upload Failed"
        details={
          <Box sx={{ mt: 2 }}>
            
            {/* General server/network error */}
            {error && (
              <Box sx={{ mb: 2 }}>
                <strong>Error:</strong> {error}
              </Box>
            )}
            
            {/* Per-item errors */}
            {hasPerSkuErrors && (
              <Box sx={{ mt: 2 }}>
                <strong>Failed Items:</strong>
                
                <Box sx={{ mt: 1 }}>
                  {failedItems.map((r) => (
                    <Box
                      key={r.skuId}
                      sx={{
                        p: 1.2,
                        mb: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "error.light",
                        bgcolor: "error.light",
                        color: "error.contrastText",
                      }}
                    >
                      <Box>
                        <strong>Product:</strong> {r.productName}
                      </Box>
                      <Box>
                        <strong>SKU:</strong> {r.skuCode}
                      </Box>
                      <Box>
                        <strong>Error:</strong> {r.error ?? "Unknown error"}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Fallback message */}
            {!error && !hasPerSkuErrors && (
              <Box sx={{ mt: 1 }}>
                An unexpected error occurred. Please try again.
              </Box>
            )}
          </Box>
        }
      />
    </CustomDialog>
  );
};

export default SkuImageUploadErrorDialog;
