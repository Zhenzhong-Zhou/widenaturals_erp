import { useCallback, useMemo, useState } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import CustomTypography from '@components/common/CustomTypography';
import {
  UpdateProductInfoErrorDialog,
  UpdateProductInfoForm,
  UpdateProductInfoSuccessDialog,
} from '@features/product/components/UpdateProductForm';
import useProductInfoUpdate from '@hooks/useProductInfoUpdate';
import type {
  FlattenedProductDetail,
  ProductUpdateRequest,
} from '@features/product/state/productTypes';
import {
  buildInitialInfoValues,
  buildProductUpdateDelta,
} from '@features/product/utils/productFormUtils';

interface ProductUpdateInfoDialogProps {
  open: boolean;
  productId: string;
  onClose: () => void;
  onSuccess?: () => void; // optional refresh callback
  productDetails: FlattenedProductDetail;
}

const ProductUpdateInfoDialog = ({
  open,
  productId,
  onClose,
  onSuccess,
  productDetails,
}: ProductUpdateInfoDialogProps) => {
  const productName = productDetails?.name ?? '';
  const [updatedFields, setUpdatedFields] = useState<string[]>([]);

  const { data, loading, error, isSuccess, updateInfo, reset } =
    useProductInfoUpdate();

  const initialValues = useMemo(
    () => buildInitialInfoValues(productDetails),
    [productDetails]
  );

  /** Close + cleanup */
  const handleClose = () => {
    reset();
    setUpdatedFields([]);
    onClose();
  };

  /** Submit handler */
  const handleSubmit = useCallback(
    async (formData: ProductUpdateRequest) => {
      const delta = buildProductUpdateDelta(initialValues, formData);

      // Track which fields were modified (optional)
      setUpdatedFields(Object.keys(delta));

      // No changes? Do nothing:
      if (Object.keys(delta).length === 0) {
        onClose(); // or show a toast "No changes detected"
        return;
      }

      await updateInfo({
        productId,
        payload: delta,
      });

      onSuccess?.();
    },
    [productId, updateInfo, onSuccess, initialValues]
  );

  // ----------------------------------------------------------
  // SUCCESS STATE — mirror UpdateProductStatusDialog behavior
  // ----------------------------------------------------------
  if (isSuccess) {
    return (
      <UpdateProductInfoSuccessDialog
        open={open}
        onClose={handleClose}
        productName={productName}
        updatedFields={updatedFields}
        responseData={data}
      />
    );
  }

  // ----------------------------------------------------------
  // ERROR STATE
  // ----------------------------------------------------------
  if (error && !loading) {
    return (
      <UpdateProductInfoErrorDialog
        open={open}
        onClose={handleClose}
        productName={productName}
        error={error}
        fields={updatedFields}
      />
    );
  }

  // ----------------------------------------------------------
  // FORM STATE (default)
  // ----------------------------------------------------------
  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Update Product Information"
      showCancelButton={!loading}
      disableCloseOnBackdrop={loading}
      disableCloseOnEscape={loading}
      maxWidth="md"
      fullWidth
    >
      <CustomTypography variant="body2" sx={{ mb: 2 }}>
        Updating information for product: <strong>{productName}</strong>
      </CustomTypography>

      <UpdateProductInfoForm
        loading={loading}
        onSubmit={handleSubmit}
        initialValues={initialValues}
      />
    </CustomDialog>
  );
};

export default ProductUpdateInfoDialog;
