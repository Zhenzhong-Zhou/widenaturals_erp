import { type FC, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import { renderInputField } from '@utils/filters/filterUtils';
import { useProductLookup, useSkuLookup } from '@hooks/index';
import type { PricingFilters } from '@features/pricing';
import { ProductDropdown, SkuDropdown } from '@features/lookup/components';
import type { ProductLookupParams, SkuLookupQueryParams } from '@features/lookup';
import { useFilterFormSync } from '@utils/filters/useFilterFormSync';

// =========================================================
// Types
// =========================================================

interface PricingFiltersPanelLookups {
  // pricingType: ReturnType<typeof usePricingTypeLookup>;
  product: ReturnType<typeof useProductLookup>;
  sku: ReturnType<typeof useSkuLookup>;
}

interface PricingLookupHandlers {
  onOpen: {
    // pricingType: () => void;
    product: () => void;
    sku: () => void;
  };
}

interface Props {
  filters: PricingFilters;
  lookups: PricingFiltersPanelLookups;
  lookupHandlers: PricingLookupHandlers;
  onChange: (filters: PricingFilters) => void;
  onFilterChange?: (filters: PricingFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

// =========================================================
// Defaults
// =========================================================

const emptyFilters: PricingFilters = {
  search: '',
  brand: '',
  category: '',
  countryCode: '',
  pricingTypeId: undefined,
  productId: undefined,
  skuId: undefined,
};

// =========================================================
// Component
// =========================================================

/**
 * Filter panel for the pricing join list page.
 *
 * Provides filtering by:
 * - search (full-text)
 * - brand, category, country code
 * - pricing type, product, SKU (UUID fields)
 * - status
 */
const PricingFiltersPanel: FC<Props> = ({
                                          filters,
                                          lookups,
                                          lookupHandlers,
                                          onChange,
                                          onFilterChange,
                                          onApply,
                                          onReset,
                                        }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<PricingFilters>({ defaultValues: filters });
  
  const watchedValues = watch();
  
  const {
    product,
    sku,
  } = lookups;
  
  const [productFetchParams, setProductFetchParams] = useState<ProductLookupParams>({
    offset: 0,
    limit: 10,
  });
  
  const handleProductInputChange = useCallback(
    (_: unknown, newValue: string, reason: string) => {
      if (reason !== 'input') return;
      const nextParams = { ...productFetchParams, keyword: newValue, offset: 0 };
      setProductFetchParams(nextParams);
      product.fetch(nextParams);
    },
    [productFetchParams, product.fetch]
  );
  
  const [skuFetchParams, setSkuFetchParams] = useState<SkuLookupQueryParams>({
    offset: 0,
    limit: 10,
  });
  
  const handleSkuInputChange = useCallback(
    (_: unknown, newValue: string, reason: string) => {
      if (reason !== 'input') return;
      const nextParams = { ...skuFetchParams, keyword: newValue, offset: 0 };
      setSkuFetchParams(nextParams);
      sku.fetch(nextParams);
    },
    [skuFetchParams, sku.fetch]
  );
  
  useFilterFormSync(watchedValues, filters, reset, onFilterChange);
  
  // -------------------------
  // Submit / Reset
  // -------------------------
  const submitFilters = (data: PricingFilters) => {
    onChange({
      ...data,
      search: data.search || undefined,
      brand: data.brand || undefined,
      category: data.category || undefined,
      countryCode: data.countryCode || undefined,
    });
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };
  
  // -------------------------
  // Render
  // -------------------------
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ProductDropdown
              options={product.options}
              value={watch('productId') ?? null}
              onChange={(val) => setValue('productId', val, { shouldDirty: true })}
              onOpen={lookupHandlers.onOpen.product}
              loading={product.loading}
              paginationMeta={product.meta}
              fetchParams={productFetchParams}
              setFetchParams={setProductFetchParams}
              onRefresh={product.fetch}
              onInputChange={handleProductInputChange}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <SkuDropdown
              options={sku.options}
              value={watch('skuId') ?? null}
              onChange={(val) => setValue('skuId', val, { shouldDirty: true })}
              onOpen={lookupHandlers.onOpen.sku}
              loading={sku.loading}
              paginationMeta={sku.meta}
              fetchParams={skuFetchParams}
              setFetchParams={setSkuFetchParams}
              onRefresh={sku.fetch}
              onInputChange={handleSkuInputChange}
            />
          </Grid>
          {renderInputField(control, 'search',      'Search',       'Product, SKU, brand…')}
          {renderInputField(control, 'brand',        'Brand')}
          {renderInputField(control, 'category',     'Category')}
          {renderInputField(control, 'countryCode',  'Country Code', 'e.g. CA, CN, GLOBAL')}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default PricingFiltersPanel;
