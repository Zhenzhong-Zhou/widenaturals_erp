import { type FC } from 'react';
import { useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { FilterPanelLayout } from '@components/index';
import {
  PackagingMaterialMultiSelectDropdown,
  ProductMultiSelectDropdown,
  SkuMultiSelectDropdown,
} from '@features/lookup/components';
import {
  renderBooleanSelectField,
  renderDateField,
  renderInputField,
  renderNumericField,
  renderSelectField,
} from '@utils/filters/filterUtils';
import { toISODate } from '@utils/dateTimeUtils';
import type { WarehouseInventoryFilters } from '@features/warehouseInventory';
import {
  usePackagingMaterialLookup,
  useProductLookup,
  useSkuLookup,
} from '@hooks/index';
import {
  useFilterLookup,
  usePackagingMaterialSearchHandlers,
  useProductSearchHandlers,
  useSkuSearchHandlers,
} from '@features/lookup/hooks';
import type { OptionType } from '@components/common/Dropdown';

// =========================================================
// Types
// =========================================================

interface WarehouseInventoryFiltersPanelLookups {
  // inventoryStatus: ReturnType<typeof useInventoryStatusLookup>;
  product: ReturnType<typeof useProductLookup>;
  sku: ReturnType<typeof useSkuLookup>;
  packagingMaterial: ReturnType<typeof usePackagingMaterialLookup>;
}

interface WarehouseInventoryLookupHandlers {
  // todo:
  onOpen: {
    // inventoryStatus: () => void;
    product: () => void;
    sku: () => void;
    packagingMaterial: () => void;
  };
}

interface Props {
  filters: WarehouseInventoryFilters;
  lookups: WarehouseInventoryFiltersPanelLookups;
  lookupHandlers: WarehouseInventoryLookupHandlers;
  onChange: (filters: WarehouseInventoryFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

// =========================================================
// Defaults
// =========================================================

const emptyFilters: WarehouseInventoryFilters = {
  search:                '',
  batchType:             undefined,
  statusIds:             undefined,
  skuIds:                undefined,
  productIds:            undefined,
  packagingMaterialIds:  undefined,
  lowStockThreshold:     undefined,
  expiringWithinDays:    undefined,
  inboundDateAfter:      undefined,
  inboundDateBefore:     undefined,
  hasReserved:           undefined,
};

const BATCH_TYPE_OPTIONS: OptionType[] = [
  { label: 'Product',           value: 'product' },
  { label: 'Packaging Material', value: 'packaging_material' },
];

// =========================================================
// Component
// =========================================================

/**
 * Filter panel for the warehouse inventory list page.
 *
 * Provides filtering by:
 * - product, SKU, packaging material (multi-select UUID lookups)
 * - inbound date range
 * - low-stock threshold, expiring-within-days
 * - full-text search
 */
const WarehouseInventoryFiltersPanel: FC<Props> = ({
                                                     filters,
                                                     lookups,
                                                     lookupHandlers,
                                                     onChange,
                                                     onApply,
                                                     onReset,
                                                   }) => {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<WarehouseInventoryFilters>({ defaultValues: filters });
  
  const { product, sku, packagingMaterial } = lookups;
  
  // -------------------------
  // Lookup bindings (with debounced keyword search)
  // -------------------------
  const productLookup = useFilterLookup({
    fieldName: 'productIds',
    lookup: product,
    watch,
    setValue,
    useSearchHandlers: useProductSearchHandlers,
  });
  
  const skuLookup = useFilterLookup({
    fieldName: 'skuIds',
    lookup: sku,
    watch,
    setValue,
    useSearchHandlers: useSkuSearchHandlers,
  });
  
  const packagingLookup = useFilterLookup({
    fieldName: 'packagingMaterialIds',
    lookup: packagingMaterial,
    watch,
    setValue,
    useSearchHandlers: usePackagingMaterialSearchHandlers,
  });
  
  // -------------------------
  // Submit / Reset
  // -------------------------
  const submitFilters = (data: WarehouseInventoryFilters) => {
    onChange({
      ...data,
      search:              data.search             || undefined,
      lowStockThreshold:   data.lowStockThreshold  || undefined,
      expiringWithinDays:  data.expiringWithinDays || undefined,
      inboundDateAfter:    toISODate(data.inboundDateAfter  || undefined),
      inboundDateBefore:   toISODate(data.inboundDateBefore || undefined),
    });
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    productLookup.reset();
    skuLookup.reset();
    packagingLookup.reset();
    onReset();
  };
  
  // -------------------------
  // Render
  // -------------------------
  // todo:  add go back and warehouse info
  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <Grid container spacing={2}>
          {/* Batch type */}
          {renderSelectField(control, 'batchType', 'Batch Type', BATCH_TYPE_OPTIONS)}
          {renderBooleanSelectField(control, 'hasReserved', 'Has Reserved')}
          
          {/* Search */}
          {renderInputField(control, 'search', 'Search', 'Lot, product, SKU, material code…')}
          
          {/* Inventory status */}
          {/*<Grid size={{ xs: 12, md: 6 }}>*/}
          {/*  <InventoryStatusDropdown*/}
          {/*    options={inventoryStatus.options}*/}
          {/*    value={watch('statusId') ?? null}*/}
          {/*    onChange={(val) => setValue('statusId', val ?? undefined, { shouldDirty: true })}*/}
          {/*    onOpen={lookupHandlers.onOpen.inventoryStatus}*/}
          {/*    loading={inventoryStatus.loading}*/}
          {/*  />*/}
          {/*</Grid>*/}
          
          {/* Product */}
          <Grid size={{ xs: 12, md: 6 }}>
            <ProductMultiSelectDropdown
              options={product.options}
              selectedOptions={productLookup.selectedOptions}
              onChange={productLookup.handleSelect}
              onOpen={lookupHandlers.onOpen.product}
              onInputChange={productLookup.onInputChange}
              inputValue={productLookup.keyword}
              loading={product.loading}
              paginationMeta={{
                ...product.meta,
                onFetchMore: productLookup.onFetchMore,
              }}
            />
          </Grid>
          
          {/* SKU */}
          <Grid size={{ xs: 12, md: 6 }}>
            <SkuMultiSelectDropdown
              options={sku.options}
              selectedOptions={skuLookup.selectedOptions}
              onChange={skuLookup.handleSelect}
              onOpen={lookupHandlers.onOpen.sku}
              onInputChange={skuLookup.onInputChange}
              inputValue={skuLookup.keyword}
              loading={sku.loading}
              paginationMeta={{
                ...sku.meta,
                onFetchMore: skuLookup.onFetchMore,
              }}
            />
          </Grid>
          
          {/* Packaging material */}
          <Grid size={{ xs: 12, md: 6 }}>
            <PackagingMaterialMultiSelectDropdown
              options={packagingMaterial.options}
              selectedOptions={packagingLookup.selectedOptions}
              onChange={packagingLookup.handleSelect}
              onOpen={lookupHandlers.onOpen.packagingMaterial}
              onInputChange={packagingLookup.onInputChange}
              inputValue={packagingLookup.keyword}
              loading={packagingMaterial.loading}
              paginationMeta={{
                ...packagingMaterial.meta,
                onFetchMore: packagingLookup.onFetchMore,
              }}
            />
          </Grid>
          
          {/* Inbound date range */}
          {renderDateField(control, 'inboundDateAfter',  'Inbound After')}
          {renderDateField(control, 'inboundDateBefore', 'Inbound Before')}
          
          {/* Numeric filters */}
          {renderNumericField(control, 'lowStockThreshold',  'Low Stock ≤',    'e.g. 10')}
          {renderNumericField(control, 'expiringWithinDays', 'Expires Within', 'e.g. 30 days')}
        </Grid>
      </FilterPanelLayout>
    </form>
  );
};

export default WarehouseInventoryFiltersPanel;
