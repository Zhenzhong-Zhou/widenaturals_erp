import { useCallback, useEffect, useState } from "react";
import type { CreateMode } from "@shared-types/shared";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CustomDialog from "@components/common/CustomDialog";
import CreateModeToggle from "@components/common/CreateModeToggle";
import useCreateProducts from "@hooks/useCreateProducts";
import {
  BulkProductForm, CreateProductSuccessDialog,
  SingleProductForm,
} from '@features/product/components/CreateProductForm';

interface ProductsCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ProductsCreateDialog = ({
                                open,
                                onClose,
                                onSuccess,
                              }: ProductsCreateDialogProps) => {
  const [mode, setMode] = useState<CreateMode>("single");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedProductNames, setSubmittedProductNames] = useState<string[]>([]);
  
  const {
    data: createdProducts,
    loading: isCreating,
    error: creationError,
    isSuccess,
    submit: createProducts,
    reset: resetCreateProducts,
  } = useCreateProducts();
  
  // Open success dialog once creation succeeds
  useEffect(() => {
    if (isSuccess) {
      setShowSuccessDialog(true);
    }
  }, [isSuccess]);
  
  const handleClose = () => {
    resetCreateProducts();
    setMode("single");
    onClose();
  };
  
  const handleSubmit = useCallback(
    async (data: any | any[]) => {
      const normalized = mode === "single" ? [data] : data;
      
      const names = normalized.map((p: { name: string }) => p.name);
      setSubmittedProductNames(names);
      
      await createProducts({ products: normalized });
    },
    [mode, createProducts]
  );
  
  return (
    <>
      {showSuccessDialog ? (
        <CreateProductSuccessDialog
          open={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            handleClose();
            onSuccess?.();
          }}
          productNames={submittedProductNames ?? ""}
          responseData={createdProducts}
        />
      ) : (
        <CustomDialog
          open={open}
          onClose={handleClose}
          title="Create Product"
          showCancelButton={!isCreating}
          disableCloseOnBackdrop={isCreating}
          disableCloseOnEscape={isCreating}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ px: 2, py: 1 }}>
            {/* Mode toggle (single or bulk) */}
            <CreateModeToggle
              value={mode}
              onChange={setMode}
              label="Product Entry Mode"
            />
            
            {/* Inline Error */}
            {creationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {creationError}
              </Alert>
            )}
            
            {/* Forms */}
            <Box sx={{ mt: 2 }}>
              {mode === "single" ? (
                <SingleProductForm
                  loading={isCreating}
                  onSubmit={handleSubmit}
                />
              ) : (
                <BulkProductForm
                  loading={isCreating}
                  onSubmit={handleSubmit}
                />
              )}
            </Box>
          </Box>
        </CustomDialog>
      )}
    </>
  );
};

export default ProductsCreateDialog;
