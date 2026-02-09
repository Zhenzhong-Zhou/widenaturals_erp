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
import type { ProductBatchFilters } from '@features/productBatch/state';
import {
  ProductMultiSelectDropdown,
  SkuMultiSelectDropdown,
  StatusMultiSelectDropdown,
  // ManufacturerMultiSelectDropdown,
} from '@features/lookup/components';
import {
  useProductLookup,
  useSkuLookup,
  useStatusLookup,
  // useManufacturerLookup,
} from '@hooks/index';
import {
  useFilterLookup,
  useMultiSelectBinding,
  useProductSearchHandlers,
  useSkuSearchHandlers,
  // useManufacturerSearchHandlers,
} from '@features/lookup/hooks';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';

/* =========================================================
 * Types
 * ======================================================= */

interface ProductBatchFiltersPanelLookups {
  product: ReturnType<typeof useProductLookup>;
  sku: ReturnType<typeof useSkuLookup>;
  // manufacturer: ReturnType<typeof useManufacturerLookup>;
  status: ReturnType<typeof useStatusLookup>;
}

interface ProductBatchLookupHandlers {
  onOpen: {
    status: () => void;
  };
}

interface Props {
  filters: ProductBatchFilters;
  lookups: ProductBatchFiltersPanelLookups;
  lookupHandlers: ProductBatchLookupHandlers;
  onChange: (filters: ProductBatchFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

/* =========================================================
 * Defaults
 * ======================================================= */

const emptyFilters: ProductBatchFilters = {
  statusIds: undefined,
  skuIds: undefined,
  productIds: undefined,
  manufacturerIds: undefined,
  lotNumber: '',
  expiryAfter: '',
  expiryBefore: '',
  manufactureAfter: '',
  manufactureBefore: '',
  receivedAfter: '',
  receivedBefore: '',
  createdAfter: '',
  createdBefore: '',
  keyword: '',
};

interface ProductBatchDateField {
  name:
    | 'expiryAfter'
    | 'expiryBefore'
    | 'manufactureAfter'
    | 'manufactureBefore'
    | 'receivedAfter'
    | 'receivedBefore'
    | 'createdAfter'
    | 'createdBefore';
  label: string;
}

export const PRODUCT_BATCH_DATE_FIELDS: ProductBatchDateField[] = [
  // --- Expiry ---
  { name: 'expiryAfter', label: 'Expiry Date ≥' },
  { name: 'expiryBefore', label: 'Expiry Date <' },
  
  // --- Manufacture ---
  { name: 'manufactureAfter', label: 'Manufacture Date ≥' },
  { name: 'manufactureBefore', label: 'Manufacture Date <' },
  
  // --- Received ---
  { name: 'receivedAfter', label: 'Received Date ≥' },
  { name: 'receivedBefore', label: 'Received Date <' },
  
  // --- Audit ---
  { name: 'createdAfter', label: 'Created Date ≥' },
  { name: 'createdBefore', label: 'Created Date <' },
];

/* =========================================================
 * Component
 * ======================================================= */

/**
 * Filter panel for Product Batch list page.
 *
 * Provides filtering by:
 * - product / SKU / manufacturer
 * - lot number
 * - lifecycle date ranges
 * - audit creation dates
 * - status
 * - keyword search
 */
const ProductBatchFiltersPanel: FC<Props> = ({
                                               filters,
                                               lookups,
                                               lookupHandlers,
                                               onChange,
                                               onApply,
                                               onReset,
                                             }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<ProductBatchFilters>({
      defaultValues: filters,
    });
  
  const {
    product,
    sku,
    // manufacturer,
    status
  } = lookups;
  
  /* -----------------------------
   * Lookup bindings
   * --------------------------- */
  
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
  
  // const manufacturerFilter = useFilterLookup({
  //   fieldName: 'manufacturerIds',
  //   lookup: manufacturer,
  //   watch,
  //   setValue,
  //   useSearchHandlers: useManufacturerSearchHandlers,
  // });
  
  /* -----------------------------
   * Sync external filters
   * --------------------------- */
  
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  /* -----------------------------
   * Submit / Reset
   * --------------------------- */
  
  const submitFilters = (data: ProductBatchFilters) => {
    const adjusted: ProductBatchFilters = {
      ...data,
      lotNumber: data.lotNumber || undefined,
      keyword: data.keyword || undefined,
      
      expiryAfter: toISODate(data.expiryAfter),
      expiryBefore: toISODate(data.expiryBefore),
      manufactureAfter: toISODate(data.manufactureAfter),
      manufactureBefore: toISODate(data.manufactureBefore),
      receivedAfter: toISODate(data.receivedAfter),
      receivedBefore: toISODate(data.receivedBefore),
      createdAfter: toISODate(data.createdAfter),
      createdBefore: toISODate(data.createdBefore),
    };
    
    onChange(adjusted);
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    
    productFilter.reset();
    skuFilter.reset();
    // manufacturerFilter.reset();
    
    onReset();
  };
  
  /* -----------------------------
   * Status multiselect
   * --------------------------- */
  
  const {
    selectedOptions: selectedStatusOptions,
    handleSelect: handleStatusSelect,
  } = useMultiSelectBinding({
    watch,
    setValue,
    fieldName: 'statusIds',
    options: status.options,
  });
  
  const formattedStatusOptions = useFormattedOptions(
    status.options,
    formatLabel
  );
  
  /* -----------------------------
   * Render
   * --------------------------- */
  
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
            {/*<ManufacturerMultiSelectDropdown*/}
            {/*  options={manufacturer.options}*/}
            {/*  selectedOptions={manufacturerFilter.selectedOptions}*/}
            {/*  onChange={manufacturerFilter.handleSelect}*/}
            {/*  onOpen={manufacturerFilter.onOpen}*/}
            {/*  loading={manufacturer.loading}*/}
            {/*  paginationMeta={{*/}
            {/*    ...manufacturer.meta,*/}
            {/*    onFetchMore: manufacturerFilter.onFetchMore,*/}
            {/*  }}*/}
            {/*  inputValue={manufacturerFilter.keyword}*/}
            {/*  onInputChange={manufacturerFilter.onInputChange}*/}
            {/*/>*/}
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <StatusMultiSelectDropdown
              options={formattedStatusOptions}
              selectedOptions={selectedStatusOptions}
              onChange={handleStatusSelect}
              onOpen={lookupHandlers.onOpen.status}
            />
          </Grid>
          
          {/* --- Keyword --- */}
          {renderInputField(
            control,
            'keyword',
            'Keyword',
            'Lot, product, SKU, manufacturer'
          )}
          
          {/* --- Lot --- */}
          {renderInputField(control, 'lotNumber', 'Lot Number')}
          
          {/* --- Date ranges --- */}
          {PRODUCT_BATCH_DATE_FIELDS.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default ProductBatchFiltersPanel;
