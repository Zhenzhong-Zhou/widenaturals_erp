import { type FC, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import CustomForm from '@components/common/CustomForm';
import type {
  CreateSkuForm,
  CreateSkuFormProps,
} from '@features/sku/types/skuFormTypes';
import {
  buildSingleSkuFields,
  buildSingleSkuPayload
} from '@features/sku/utils';

const CreateSkuSingleForm: FC<CreateSkuFormProps> = ({
  allowManualBrandCategory,
  allowManualVariantCode,
  allowManualRegionCode,
  allowManualMarketRegion,
  onSubmit,
  canCreateSku,
  skuCodeBase,
  product,
  skuCodeBaseDropdown,
  productDropdown,
  handleSkuCodeBaseSearch,
  handleProductSearch,
  parseSkuCodeBaseLabel,
  isCreating,
}) => {
  // -------------------------------------------------------------------------
  // RHF form
  // -------------------------------------------------------------------------
  const form = useForm<CreateSkuForm>({
    mode: 'onChange',
    defaultValues: {
      product_id: null,
      sku_code_base_id: null,
      brand_code: null,
      category_code: null,
      variant_code: null,
      region_code: null,
      barcode: '',
      language: 'en-fr',
      market_region: 'CA',
      size_label: '',
      length_cm: null,
      width_cm: null,
      height_cm: null,
      weight_g: null,
      description: '',
    },
  });

  // -------------------------------------------------------------------------
  // Fields
  // -------------------------------------------------------------------------
  const fields = buildSingleSkuFields({
    form,
    allowManualBrandCategory,
    allowManualVariantCode,
    allowManualRegionCode,
    allowManualMarketRegion,
    skuCodeBase,
    product,
    skuCodeBaseDropdown,
    productDropdown,
    handleSkuCodeBaseSearch,
    handleProductSearch,
    parseSkuCodeBaseLabel,
  });

  const canSubmit = form.formState.isValid && !isCreating && canCreateSku;

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------
  const handleSingleSubmit = useCallback(
    (formData: any) => {
      const payload = buildSingleSkuPayload(formData, form);
      return onSubmit([payload]);
    },
    [onSubmit]
  );

  return (
    <CustomForm
      fields={fields}
      showSubmitButton
      showSubmitButtonOverride={!canSubmit}
      onSubmit={handleSingleSubmit}
      disabled={isCreating}
      sx={{ maxWidth: { xs: '100%', sm: '1200px' } }}
    />
  );
};

export default CreateSkuSingleForm;
