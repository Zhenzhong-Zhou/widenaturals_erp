import { useState } from 'react';
import {
  CustomDialog,
  CustomTypography,
} from '@components/index';
import { SkuImageUploadCard } from '@features/skuImage/components/UploadImageForm';
import useSkuImageUpload from '@hooks/useSkuImageUpload';
import type {
  BulkSkuImageUploadItem,
  SkuImageUploadCardData,
} from '@features/skuImage/state';
import { serializeBulkSkuImageUpload } from '@features/skuImage/utils/imageFormatUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  skuId: string;
  skuCode: string;
  displayProductName: string;
  onSuccess?: () => void;
}

const SkuImageUploadDialog = ({
                                open,
                                onClose,
                                skuId,
                                skuCode,
                                displayProductName,
                                onSuccess,
                              }: Props) => {
  const {
    loading,
    error,
    isSuccess,
    uploadImages,
    reset,
  } = useSkuImageUpload();
  
  const [item, setItem] = useState<SkuImageUploadCardData>({
    skuId,
    skuCode,
    displayProductName,
    images: [],
  });
  
  // ---------------------------------------------
  // Build FormData (same logic as bulk page)
  // ---------------------------------------------
  const buildFormData = (items: BulkSkuImageUploadItem[]) => {
    const form = new FormData();
    
    form.append(
      'skus',
      JSON.stringify(serializeBulkSkuImageUpload(items))
    );
    
    items.forEach((i) => {
      i.images.forEach((img) => {
        if (img.file) {
          form.append('files', img.file);
        }
      });
    });
    
    return form;
  };
  
  // ---------------------------------------------
  // Submit
  // ---------------------------------------------
  const handleSubmit = async () => {
    try {
      if (item.images.length === 0) {
        onClose();
        return;
      }
      
      const formData = buildFormData([item]);
      
      await uploadImages(formData);
      
      onSuccess?.();
      reset();
      onClose();
    } catch {
      // slice handles error
    }
  };
  
  const handleClose = () => {
    reset();
    onClose();
  };
  
  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Upload SKU Images"
      confirmButtonText="Upload"
      onConfirm={handleSubmit}
      disableCloseOnBackdrop={loading}
      disableCloseOnEscape={loading}
    >
      <SkuImageUploadCard
        data={item}
        onChange={setItem}
      />
      
      {error && (
        <CustomTypography color="error" sx={{ mt: 2 }}>
          {error}
        </CustomTypography>
      )}
    </CustomDialog>
  );
};

export default SkuImageUploadDialog;
