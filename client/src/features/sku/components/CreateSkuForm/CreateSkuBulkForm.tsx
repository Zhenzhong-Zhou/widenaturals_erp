import { type FC, useCallback } from 'react';
import MultiItemForm from '@components/common/MultiItemForm';
import type {
  BulkSkuRow,
  CreateSkuFormProps,
} from '@features/sku/types/skuFormTypes';
import {
  buildBulkSkuFields,
  buildBulkSkuPayload
} from '@features/sku/utils';

const CreateSkuBulkForm: FC<CreateSkuFormProps> = ({
  allowManualBrandCategory,
  allowManualVariantCode,
  allowManualRegionCode,
  allowManualMarketRegion,
  onSubmit,
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
  // Fields
  // -------------------------------------------------------------------------
  const fields = buildBulkSkuFields({
    allowManualBrandCategory,
    allowManualVariantCode,
    allowManualRegionCode,
    allowManualMarketRegion,
    skuCodeBase,
    skuCodeBaseDropdown,
    product,
    productDropdown,
    handleSkuCodeBaseSearch,
    handleProductSearch,
    parseSkuCodeBaseLabel,
  });

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------
  const handleBulkInternal = useCallback(
    async (rows: BulkSkuRow[]) => {
      const payload = rows.map(buildBulkSkuPayload); // convert rows → SKUs
      await onSubmit(payload); // call parent handler
    },
    [onSubmit]
  );

  return (
    <MultiItemForm
      fields={fields}
      onSubmit={handleBulkInternal}
      showSubmitButton={!isCreating}
      defaultValues={[
        {
          product_id: '',
          variant_code: '',
          region_code: '',
          brand_code: '',
          category_code: '',
          barcode: '',
          language: 'en-fr',
          market_region: 'Canada',
          size_label: '',
        },
      ]}
      itemsPerRow={2}
    />
  );
};

export default CreateSkuBulkForm;
