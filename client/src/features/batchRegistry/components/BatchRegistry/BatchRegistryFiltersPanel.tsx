import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import {
  renderDateField,
  renderInputField,
} from '@utils/filters/filterUtils';
import { formatLabel } from '@utils/textUtils';
import { toISODate } from '@utils/dateTimeUtils';
import type { BatchRegistryFilters } from '@features/batchRegistry/state';
import {
  PackagingMaterialMultiSelectDropdown,
  ProductMultiSelectDropdown,
  SkuMultiSelectDropdown,
  StatusMultiSelectDropdown,
} from '@features/lookup/components';
import {
  usePackagingMaterialLookup,
  useProductLookup,
  useSkuLookup,
  useStatusLookup,
} from '@hooks/index';
import {
  useFilterLookup,
  useMultiSelectBinding,
  usePackagingMaterialSearchHandlers,
  useProductSearchHandlers,
  useSkuSearchHandlers,
} from '@features/lookup/hooks';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

interface BatchRegistryFiltersPanelLookups {
  product: ReturnType<typeof useProductLookup>;
  sku: ReturnType<typeof useSkuLookup>;
  packagingMaterial: ReturnType<typeof usePackagingMaterialLookup>;
  status: ReturnType<typeof useStatusLookup>;
}

interface BatchRegistryLookupHandlers {
  onOpen: {
    status: () => void;
  };
}

interface Props {
  filters: BatchRegistryFilters;
  /** Lookup data & state (options, loading, etc.) */
  lookups: BatchRegistryFiltersPanelLookups;
  
  /** Lookup UI handlers (lazy fetch on open, etc.) */
  lookupHandlers: BatchRegistryLookupHandlers;
  onChange: (filters: BatchRegistryFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/** Empty baseline filter values */
const emptyFilters: BatchRegistryFilters = {
  batchType: undefined,
  statusIds: undefined,
  skuIds: undefined,
  productIds: undefined,
  manufacturerIds: undefined,
  packagingMaterialIds: undefined,
  supplierIds: undefined,
  lotNumber: '',
  expiryAfter: '',
  expiryBefore: '',
  registeredAfter: '',
  registeredBefore: '',
  keyword: '',
};

interface BatchRegistryDateField {
  name:
    | 'expiryAfter'
    | 'expiryBefore'
    | 'registeredAfter'
    | 'registeredBefore';
  label: string;
}

export const BATCH_REGISTRY_DATE_FIELDS: BatchRegistryDateField[] = [
  // ----------------------------------------
  // Expiry date range
  // ----------------------------------------
  { name: 'expiryAfter', label: 'Expiry Date ≥' },
  { name: 'expiryBefore', label: 'Expiry Date <' },
  
  // ----------------------------------------
  // Registration date range
  // ----------------------------------------
  { name: 'registeredAfter', label: 'Registered Date ≥' },
  { name: 'registeredBefore', label: 'Registered Date <' },
];

/**
 * Filter panel for Batch Registry list page.
 *
 * Provides filtering by:
 * - batch type
 * - lot number
 * - expiry range
 * - registration date range
 * - keyword search
 *
 * Follows the same UX and architectural pattern
 * as BomFiltersPanel.
 */
const BatchRegistryFiltersPanel: FC<Props> = ({
                                                filters,
                                                lookups,
                                                lookupHandlers,
                                                onChange,
                                                onApply,
                                                onReset,
                                              }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<BatchRegistryFilters>({
      defaultValues: filters,
    });
  
  const { product, sku, status } = lookups;
  
  const productFilter = useFilterLookup({
    fieldName: 'productIds',
    lookup: product,
    watch,
    setValue,
    useSearchHandlers: useProductSearchHandlers,
  });
  
  const skuFilter = useFilterLookup({
    fieldName: 'skuIds',
    lookup: sku,
    watch,
    setValue,
    useSearchHandlers: useSkuSearchHandlers,
  });
  
  const packagingFilter = useFilterLookup({
    fieldName: 'packagingMaterialIds',
    lookup: lookups.packagingMaterial,
    watch,
    setValue,
    useSearchHandlers: usePackagingMaterialSearchHandlers,
  });
  
  // ----------------------------------------
  // Sync external filters
  // ----------------------------------------
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  // ----------------------------------------
  // Submit & reset handlers
  // ----------------------------------------
  const submitFilters = (data: BatchRegistryFilters) => {
    const adjusted: BatchRegistryFilters = {
      ...data,
      lotNumber: data.lotNumber || undefined,
      expiryAfter: toISODate(data.expiryAfter),
      expiryBefore: toISODate(data.expiryBefore),
      registeredAfter: toISODate(data.registeredAfter),
      registeredBefore: toISODate(data.registeredBefore),
      keyword: data.keyword || undefined,
    };
    console.log('adjusted', adjusted)
    onChange(adjusted);
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    
    productFilter.reset();
    skuFilter.reset();
    packagingFilter.reset();
    
    onReset();
  };
  
  // -------------------------------
  // Multi-select bindings (RHF ↔ UI)
  // -------------------------------
  const {
    selectedOptions: selectedStatusOptions,
    handleSelect: handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusIds',
    options: status.options,
  });
  
  // -------------------------------
  // Derived lookup options
  // -------------------------------
  const formattedStatusOptions = useFormattedOptions(
    status.options,
    formatLabel
  );
  
  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ProductMultiSelectDropdown
              options={product.options}
              selectedOptions={productFilter.selectedOptions}
              onChange={productFilter.handleSelect}
              onOpen={productFilter.onOpen}
              loading={product.loading}
              paginationMeta={{
                ...product.meta,
                onFetchMore: productFilter.onFetchMore,
              }}
              inputValue={productFilter.keyword}
              onInputChange={productFilter.onInputChange}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <SkuMultiSelectDropdown
              options={sku.options}
              selectedOptions={skuFilter.selectedOptions}
              onChange={skuFilter.handleSelect}
              onOpen={skuFilter.onOpen}
              loading={sku.loading}
              paginationMeta={{
                ...sku.meta,
                onFetchMore: skuFilter.onFetchMore,
              }}
              inputValue={skuFilter.keyword}
              onInputChange={skuFilter.onInputChange}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <PackagingMaterialMultiSelectDropdown
              options={lookups.packagingMaterial.options}
              selectedOptions={packagingFilter.selectedOptions}
              onChange={packagingFilter.handleSelect}
              onOpen={packagingFilter.onOpen}
              loading={lookups.packagingMaterial.loading}
              paginationMeta={{
                ...lookups.packagingMaterial.meta,
                onFetchMore: packagingFilter.onFetchMore,
              }}
              inputValue={packagingFilter.keyword}
              onInputChange={packagingFilter.onInputChange}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <StatusMultiSelectDropdown
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={lookupHandlers.onOpen.status}
            />
          </Grid>
          
          {/* --- Keyword search --- */}
          {renderInputField(
            control,
            'keyword',
            'Keyword',
            'Lot, product, SKU, material, supplier'
          )}
          
          {/* --- Lot --- */}
          {renderInputField(
            control,
            'lotNumber',
            'Lot Number'
          )}
          
          {/* ------------------------------------
           * Date range filters
           * ------------------------------------ */}
          {BATCH_REGISTRY_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default BatchRegistryFiltersPanel;
