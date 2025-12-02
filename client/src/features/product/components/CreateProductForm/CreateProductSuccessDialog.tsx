import type { FC } from "react";
import { useNavigate } from 'react-router-dom';
import Box from "@mui/material/Box";
import Stack from '@mui/material/Stack';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomDialog from "@components/common/CustomDialog";
import ResultBody from "@components/common/ResultBody";
import DetailsSection from '@components/common/DetailsSection';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import type { CreateProductResponse } from "@features/product/state";

interface CreateProductSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  
  /** Product names from the submitted form */
  productNames: string[];
  
  /** Full API response returned after creation */
  responseData: CreateProductResponse;
}

const CreateProductSuccessDialog: FC<CreateProductSuccessDialogProps> = ({
                                                                           open,
                                                                           onClose,
                                                                           productNames,
                                                                           responseData,
                                                                         }) => {
  const navigate = useNavigate();
  
  /** Merge names (from form) with IDs (from backend) */
  const productList = responseData.data.map((item, index) => ({
    id: item.id,
    name: productNames[index] ?? "Unnamed Product",
  }));
  
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Product Created"
      confirmButtonText="OK"
      onConfirm={onClose}
    >
      <ResultBody
        icon={<CheckCircleIcon color="success" sx={{ fontSize: 48 }} />}
        message={responseData.message}
        details={
          <>
            {/* Summary Section */}
            <DetailsSection
              sectionTitle="Summary"
              fields={[
                { label: "Submitted", value: responseData.stats.inputCount },
                { label: "Created", value: responseData.stats.processedCount },
                { label: "Elapsed Time", value: `${responseData.stats.elapsedMs} ms` },
              ]}
            />
            
            {/* Product List */}
            <Stack spacing={2} sx={{ mt: 2 }}>
              {productList.map((product) => (
                <Stack
                  key={product.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    border: "1px solid #eee",
                    borderRadius: 1,
                    padding: 1.5,
                  }}
                >
                  <CustomTypography variant="body1" fontWeight={500}>
                    {product.name}
                  </CustomTypography>
                  
                  <CustomButton
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    View
                  </CustomButton>
                </Stack>
              ))}
            </Stack>
            
            {/* Deep Link to Product List */}
            {productList.length > 1 && (
              <Box sx={{ mt: 3 }}>
                <CustomButton
                  variant="contained"
                  fullWidth
                  onClick={() => navigate("/products")}
                >
                  Back to Product List
                </CustomButton>
              </Box>
            )}
          </>
        }
      />
    </CustomDialog>
  );
};

export default CreateProductSuccessDialog;
