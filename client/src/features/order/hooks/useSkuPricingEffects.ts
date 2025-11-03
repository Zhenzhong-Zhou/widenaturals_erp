import { useEffect } from 'react';
import type {
  SkuLookupQueryParams,
  PricingLookupQueryParams,
} from '@features/lookup/state';

interface UseSkuPricingEffectsParams {
  showBarcode: boolean;
  selectedSkuId: string | null;

  // SKU state
  skuFetchParams: SkuLookupQueryParams;
  setSkuFetchParams: (params: SkuLookupQueryParams) => void;
  fetchSku: (params: SkuLookupQueryParams) => void;

  // Pricing state
  pricingFetchParams: PricingLookupQueryParams;
  setPricingFetchParams: (params: PricingLookupQueryParams) => void;
  fetchPricing: (params: PricingLookupQueryParams) => void;
  setPricingInputValue: (value: string) => void;
}

const useSkuPricingEffects = ({
  showBarcode,
  selectedSkuId,
  skuFetchParams,
  setSkuFetchParams,
  fetchSku,
  pricingFetchParams,
  setPricingFetchParams,
  fetchPricing,
  setPricingInputValue,
}: UseSkuPricingEffectsParams) => {
  // React to showBarcode toggle
  useEffect(() => {
    const updatedSkuParams = {
      ...skuFetchParams,
      includeBarcode: showBarcode,
    };

    setSkuFetchParams(updatedSkuParams);
    fetchSku(updatedSkuParams);
  }, [showBarcode]);

  // React to selected SKU
  useEffect(() => {
    if (!selectedSkuId) return;

    const updatedPricingParams = {
      ...pricingFetchParams,
      skuId: selectedSkuId,
      offset: 0,
    };

    setPricingFetchParams(updatedPricingParams);
    fetchPricing(updatedPricingParams);
    setPricingInputValue('');
  }, [selectedSkuId]);
};

export default useSkuPricingEffects;
